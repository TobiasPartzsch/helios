import { UI } from "./elements";

export function initRouteController(
    onPathLoad: (path: string) => void,
    onFileLoad: (file: File) => void,
) {
    UI.buttons.browseRoute.onclick = () => UI.inputs.routeFilePicker.click();

    UI.inputs.routeFile.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
            onPathLoad(UI.inputs.routeFile.value.trim());
        }
    });

    UI.inputs.routeFilePicker.addEventListener("change", () => {
        const file = UI.inputs.routeFilePicker.files?.[0];
        if (file) onFileLoad(file);
    });
}