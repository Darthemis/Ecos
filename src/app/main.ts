import "../style.css";
import { bootstrap } from "./bootstrap";
import { startGame } from "./game";

startGame(bootstrap(document.querySelector<HTMLElement>("#app")!));
