// Configuration presence is not evidence of a successful provider operation.
export function integrationReadiness(env = {}) {
  return {
    version: '7.0.0',
    liveProvidersVerified: false,
    items: [
      {id: 'local', label: 'Calcoli EUR, civici e piani geospaziali', state: 'available_local'},
      {id: 'openai', label: 'OpenAI', state: env.OPENAI_API_KEY ? 'configured_not_verified' : 'configuration_required', execution: 'certified_runtime_required'},
      {id: 'gemini', label: 'Gemini', state: env.GEMINI_API_KEY ? 'configured_not_verified' : 'configuration_required', execution: 'certified_runtime_required'},
      {id: 'fabrick', label: 'Fabrick AIS/PIS', state: 'offline_mock_only'},
      {id: 'infocert', label: 'InfoCert', state: 'offline_mock_only'},
      {id: 'booking', label: 'Booking / PMS', state: 'provider_authorization_and_live_test_required'},
      {id: 'pole', label: 'Pole Position staging API', state: env.POLE_STAGING_ENABLED === 'true' && String(env.POLE_DB_PATH||'').startsWith('/') ? 'configured_not_verified' : 'configuration_required', execution: 'staging_only_no_production'},
      {id: 'dbr', label: 'DBRELAY esterno', state: 'configuration_required'},
      {id: 'pole-payments', label: 'Pole Position Stripe test checkout', state: env.POLE_TEST_CHECKOUT_ENABLED === 'true' && String(env.POLE_STRIPE_TEST_SECRET_KEY||'').startsWith('sk_test_') ? 'configured_not_verified' : 'configuration_required', execution: 'stripe_test_only'},
      {id: 'stripe', label: 'Stripe webhook', state: env.STRIPE_WEBHOOK_SECRET ? 'configured_not_verified' : 'configuration_required'},
      {id: 'android', label: 'Installazione Redmi', state: 'device_acceptance_required'}
    ]
  };
}
