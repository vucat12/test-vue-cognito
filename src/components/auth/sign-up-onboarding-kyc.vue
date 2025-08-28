<template>
  <div>
    <h1>KYC</h1>
    <p>Complete your KYC here (placeholder form).</p>
    <button @click="completeKyc">{{ isLoading ? 'Please wait...' : 'Complete KYC' }}</button>
    <p v-if="error">{{ error }}</p>
  </div>
</template>

<script setup>
import { ref } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "@/stores/useAuthStore";
import { authHandler } from "@/services/authHandler";

const router = useRouter();
const auth = useAuthStore();
const error = ref("");
const isLoading = ref(false);

async function completeKyc() {
  const start = performance.now();
  console.log("[KYC] User clicked Complete KYC at:", new Date().toISOString());

  try {
    isLoading.value = true;
    console.log("[UI] Button changed to 'Please wait...'");

    // --- Update Cognito ---
    await authHandler.updateProfileAttributes({ "custom:kyc": "true" });
    const mid = performance.now();
    console.log(`[KYC] updateProfileAttributes took ${(mid - start).toFixed(2)} ms`);

    // --- Restore Session ---
    const { idToken } = await authHandler.restoreSession();
    const end = performance.now();
    console.log(`[KYC] restoreSession took ${(end - mid).toFixed(2)} ms`);
    console.log(`[KYC] Total KYC completion flow took ${(end - start).toFixed(2)} ms`);

    // --- Update local state ---
    auth.setTokenAndDecode(idToken);
    console.log("[KYC] Cognito update finished → navigating to /dashboard");

    router.push("/dashboard");
  } catch (err) {
    error.value = "Failed to complete KYC: " + (err.message || "Unknown error");
    console.error("[KYC] Error during KYC completion:", err);
  } finally {
    isLoading.value = false;
    console.log("[UI] Button reset to 'Complete KYC'");
  }
}

</script>
<script>
export const assets = {
  critical: ["/css/onboarding.css"],
  high: [],
  normal: ["/images/kyc-bg.jpg"],
};
</script>
