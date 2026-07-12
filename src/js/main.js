import { createApp } from 'vue';
import 'normalize.css';
import '../css/main.scss';
import App from './layouts/App.vue';

document.documentElement.style.width = (localStorage.popupWidth || 500) + 'px';
document.documentElement.style.height = (localStorage.popupHeight || 400) + 'px';

createApp(App).mount('#app');
