function between(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function getExtensionApi() {
  return globalThis.browser || globalThis.chrome;
}

function queryActiveTab(api) {
  const query = { active: true, currentWindow: true };

  if (globalThis.browser && api === globalThis.browser) {
    return api.tabs.query(query).then(tabs => tabs[0]);
  }

  return new Promise(resolve => {
    api.tabs.query(query, tabs => resolve(tabs[0]));
  });
}

function executeScript(api, tabId) {
  if (api.scripting && api.scripting.executeScript) {
    const details = {
      target: { tabId },
      func: () => window.getSelection().toString()
    };

    if (globalThis.browser && api === globalThis.browser) {
      return api.scripting.executeScript(details)
        .then(results => results && results[0] ? results[0].result : '');
    }

    return new Promise(resolve => {
      api.scripting.executeScript(details, results => {
        const error = api.runtime.lastError;
        resolve(error || !results || !results[0] ? '' : results[0].result);
      });
    });
  }

  return new Promise(resolve => {
    api.tabs.executeScript(
      tabId,
      { code: 'window.getSelection().toString();' },
      selection => {
        const error = api.runtime.lastError;
        resolve(error || !selection ? '' : selection[0]);
      }
    );
  });
}

function getSelectedText() {
  const api = getExtensionApi();

  if (!api || !api.tabs) {
    return Promise.resolve('');
  }

  return queryActiveTab(api)
    .then(tab => tab && tab.id ? executeScript(api, tab.id) : '')
    .catch(() => '');
}

export { between, getSelectedText }
