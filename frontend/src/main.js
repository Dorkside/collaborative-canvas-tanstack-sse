import "./assets/main.css";

import { createApp } from "vue";
import { VueQueryPlugin } from "@tanstack/vue-query";
import VueKonva from "vue-konva";
import App from "./App.vue";
import router from './router';

const app = createApp(App);

app.use(VueQueryPlugin);
app.use(VueKonva);
app.use(router);

app.mount("#app");
