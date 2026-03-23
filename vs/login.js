(function () {
  const I18N = window.EnvDashI18n;
  const Common = window.EnvDashCommon;

  Common.renderHeader({ containerId: "app-header", activePage: "", metaId: "meta-summary" });

  const params = new URLSearchParams(window.location.search);
  const nextPath = params.get("next") || "admin.html";
  const form = document.getElementById("login-form");
  const passwordInput = document.getElementById("login-password");
  const status = document.getElementById("login-status");
  const metaSummary = document.getElementById("meta-summary");

  function setStatus(type, message) {
    status.className = `status-message${type ? ` ${type}` : ""}`;
    status.textContent = message || "";
  }

  function getNextUrl() {
    return Common.buildAppUrl(nextPath);
  }

  async function init() {
    metaSummary.textContent = I18N.t("admin.loginTitle");
    try {
      const auth = await Common.fetchAdminAuthStatus();
      if (auth.authenticated) {
        window.location.replace(getNextUrl());
      }
    } catch (error) {
      setStatus("error", I18N.t("messages.loadingFailed"));
    }
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    try {
      setStatus("", I18N.t("messages.saving"));
      await Common.loginAdmin(passwordInput.value);
      setStatus("success", I18N.t("admin.loginSuccess"));
      window.location.replace(getNextUrl());
    } catch (error) {
      setStatus("error", error.message || I18N.t("admin.loginRequired"));
    }
  });

  init();
}());
