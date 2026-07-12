const audio = new Audio;

export default {
  translate(text, sourceLanguage, targetLanguage) {
    const url =
      'https://translate.googleapis.com/translate_a/single' +
      '?client=gtx' +
      '&dt=t' +
      '&dt=bd' +
      '&sl=' + encodeURIComponent(sourceLanguage) +
      '&tl=' + encodeURIComponent(targetLanguage) +
      '&q=' + encodeURIComponent(text);

    return fetch(url)
      .then(response => response.json())
      .then(response => {
        let result = response[0].map(value => value[0]).join('');

        let additional = [];
        if (response[1]) {
          response[1].forEach(value => {
            additional.push({
              title: value[0],
              items: value[1]
            });
          });
        }

        const detectedLanguage = response[2];

        return { result, additional, detectedLanguage };
      });
  },

  voice(text, language) {
    const url =
      'https://translate.google.com/translate_tts' +
        '?client=gtx' +
        '&ie=UTF-8' +
        '&tl=' + encodeURIComponent(language) +
        '&q=' + encodeURIComponent(text);

    audio.src = url;

    return audio.play();
  }
}
