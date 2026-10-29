import asyncio
import os
from io import BytesIO
import unittest
from unittest.mock import MagicMock, patch

from fastapi import BackgroundTasks, Depends, FastAPI, HTTPException, UploadFile
from fastapi.testclient import TestClient

from app.routes import auth, upload
from app.security import create_admin_session, is_valid_admin_session, require_api_token


class AdminAuthenticationTests(unittest.TestCase):
    def setUp(self) -> None:
        upload.UPLOADS.clear()
        self.environment = patch.dict(
            os.environ,
            {
                "APP_ENV": "production",
                "API_ADMIN_TOKEN": "test-api-secret",
                "ADMIN_USERNAME": "test-admin",
                "ADMIN_PASSWORD": "test-password",
                "ADMIN_USERS": "",
            },
            clear=False,
        )
        self.environment.start()

        app = FastAPI()
        self.app = app
        app.include_router(auth.router, prefix="/api")

        @app.get("/api/protected")
        def protected(_identity: str = Depends(require_api_token)):
            return {"protected": True}

        self.client = TestClient(app, base_url="https://testserver")

    def tearDown(self) -> None:
        self.client.close()
        self.environment.stop()

    def test_no_or_wrong_credential_is_rejected(self) -> None:
        self.assertEqual(self.client.get("/api/protected").status_code, 401)
        self.assertEqual(
            self.client.get(
                "/api/protected",
                headers={"Authorization": "Bearer wrong-token"},
            ).status_code,
            401,
        )
        response = self.client.post(
            "/api/auth/login",
            json={"username": "test-admin", "password": "wrong-password"},
        )
        self.assertEqual(response.status_code, 401)

    def test_login_cookie_authenticates_and_logout_revokes_browser_access(self) -> None:
        login = self.client.post(
            "/api/auth/login",
            json={"username": "test-admin", "password": "test-password"},
        )
        self.assertEqual(login.status_code, 200)
        self.assertIn("httponly", login.headers["set-cookie"].lower())
        self.assertIn("secure", login.headers["set-cookie"].lower())
        self.assertIn("samesite=strict", login.headers["set-cookie"].lower())
        self.assertEqual(self.client.get("/api/auth/session").json(), {"authenticated": True})
        self.assertEqual(self.client.get("/api/protected").status_code, 200)

        session_cookie = self.client.cookies.get("crimevista_admin_session")
        refreshed_client = TestClient(self.app, base_url="https://testserver")
        refreshed_client.cookies.set(
            "crimevista_admin_session",
            session_cookie,
            path="/api",
        )
        self.assertEqual(
            refreshed_client.get("/api/protected").status_code,
            200,
        )
        refreshed_client.close()

        logout = self.client.post("/api/auth/logout")
        self.assertEqual(logout.status_code, 200)
        self.assertEqual(self.client.get("/api/auth/session").json(), {"authenticated": False})
        self.assertEqual(self.client.get("/api/protected").status_code, 401)

    def test_multiple_admin_accounts_can_sign_in_with_individual_passwords(self) -> None:
        with patch.dict(
            os.environ,
            {
                "ADMIN_USERS": (
                    '[{"username":"first-admin","password":"first-password"},'
                    '{"username":"second-admin","password":"second-password"}]'
                )
            },
        ):
            for username, password in (
                ("first-admin", "first-password"),
                ("second-admin", "second-password"),
            ):
                with self.subTest(username=username):
                    response = self.client.post(
                        "/api/auth/login",
                        json={"username": username, "password": password},
                    )
                    self.assertEqual(response.status_code, 200)

            wrong_password = self.client.post(
                "/api/auth/login",
                json={"username": "first-admin", "password": "second-password"},
            )
            unknown_user = self.client.post(
                "/api/auth/login",
                json={"username": "unknown-admin", "password": "first-password"},
            )
            self.assertEqual(wrong_password.status_code, 401)
            self.assertEqual(unknown_user.status_code, 401)

    def test_malformed_admin_users_configuration_is_reported(self) -> None:
        for configured_users in ("not-json", "[]", '[{"username":"missing-password"}]'):
            with self.subTest(configured_users=configured_users):
                with patch.dict(os.environ, {"ADMIN_USERS": configured_users}):
                    response = self.client.post(
                        "/api/auth/login",
                        json={"username": "test-admin", "password": "test-password"},
                    )
                self.assertEqual(response.status_code, 503)

    def test_server_token_remains_a_valid_direct_bearer_credential(self) -> None:
        response = self.client.get(
            "/api/protected",
            headers={"Authorization": "Bearer test-api-secret"},
        )
        self.assertEqual(response.status_code, 200)

    def test_session_signature_and_expiration_are_checked(self) -> None:
        session, expires_at = create_admin_session("test-api-secret", now=1000)
        self.assertTrue(is_valid_admin_session(session, "test-api-secret", now=1000))
        self.assertFalse(
            is_valid_admin_session(session, "test-api-secret", now=expires_at)
        )
        self.assertFalse(
            is_valid_admin_session(f"{session}tampered", "test-api-secret", now=1000)
        )
        self.assertFalse(is_valid_admin_session(None, "test-api-secret", now=1000))

    def test_csv_upload_returns_queued_before_processing_completes(self) -> None:
        content = (
            b"crime_id,date,area,crime_type,severity\n"
            b"crime-1,2025-01-01,Central,theft,low\n"
        )
        background_tasks = BackgroundTasks()
        session_manager = MagicMock()
        with (
            patch.object(upload, "SessionLocal", return_value=session_manager),
            patch.object(upload, "replace_records", return_value=(0, 1)),
        ):
            response = asyncio.run(
                upload.upload(
                    background_tasks=background_tasks,
                    file=UploadFile(filename="sample.csv", file=BytesIO(content)),
                    _token="test-api-secret",
                )
            )
            self.assertEqual(response["stage"], "queued")
            self.assertEqual(response["analysisStatus"], "pending")
            self.assertEqual(len(background_tasks.tasks), 1)

            with self.assertRaises(HTTPException) as conflict:
                asyncio.run(
                    upload.upload(
                        background_tasks=BackgroundTasks(),
                        file=UploadFile(
                            filename="second.csv", file=BytesIO(content)
                        ),
                        _token="test-api-secret",
                    )
                )
            self.assertEqual(conflict.exception.status_code, 409)

            asyncio.run(background_tasks())

        final_status = upload.UPLOADS[response["uploadId"]]
        self.assertEqual(final_status["stage"], "completed")
        self.assertEqual(final_status["rowsImported"], 1)
        self.assertEqual(final_status["rowsReceived"], 1)


if __name__ == "__main__":
    unittest.main()
