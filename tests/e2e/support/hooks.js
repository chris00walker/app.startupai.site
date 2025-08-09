const { BeforeAll, AfterAll, setDefaultTimeout } = require('@cucumber/cucumber');

setDefaultTimeout(60 * 1000);

BeforeAll(async function () {
  // TODO: initialize HTTP client, base URL from env, etc.
});

AfterAll(async function () {
  // TODO: cleanup resources
});
