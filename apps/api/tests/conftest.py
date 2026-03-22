"""pytest conftest — patch Supabase + NVIDIA clients before any module import."""
import os
import sys
from unittest.mock import MagicMock, patch

# Use JWT-format fake keys so Supabase client doesn't reject them on validation.
# Supabase service keys are JWTs; these have valid structure but are not real.
_FAKE_SUPABASE_JWT = (
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9"
    ".eyJyb2xlIjoic2VydmljZV9yb2xlIn0"
    ".SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c"
)

# Must be set before any app module is imported so module-level code can read them
os.environ.setdefault("SUPABASE_URL", "https://test.supabase.co")
os.environ.setdefault("SUPABASE_SERVICE_KEY", _FAKE_SUPABASE_JWT)
os.environ.setdefault("NVIDIA_API_KEY", "test-nvidia-key")
os.environ.setdefault("NVIDIA_NIM_API_KEY", "test-nim-key")

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Patch supabase.create_client globally so the module-level call in
# dependencies.py never tries to connect to real Supabase servers.
_mock_supabase_client = MagicMock()
_patcher = patch("supabase.create_client", return_value=_mock_supabase_client)
_patcher.start()
