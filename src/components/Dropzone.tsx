import { Component, createSignal, onCleanup, onMount } from "solid-js";
import { UnlistenFn, listen } from "@tauri-apps/api/event";
import { open } from "@tauri-apps/api/dialog";

export const Dropzone: Component<{
    onDrop: (path: string) => void;
}> = (props) => {
    let dropzoneRef: HTMLDivElement | undefined;
    const [isHover, setIsNover] = createSignal(false);

    const unlistens: UnlistenFn[] = [];
    onMount(async () => {
        console.log('listen to file drop')
        unlistens.push(
            await listen("tauri://file-drop", async (event) => {
                const payload = event.payload as string[];
                console.log(payload)
                setIsNover(false);
                props.onDrop(payload[0]);
            })
        )
        unlistens.push(
            await listen("tauri://file-drop-hover", (event) => {
                console.log('file-drop-hover', event)
                setIsNover(true);
            })
        );
        unlistens.push(
            await listen("tauri://file-drop-cancelled", (event) => {
                console.log('file-drop-cancelled', event)
                setIsNover(false);
            })
        )
    })

    onCleanup(() => {
        unlistens.map((unlisten) => {
            unlisten();
        })
    })

    const handleFileInput = async () => {
        const selected = await open({
            multiple: false,
            defaultPath: localStorage.getItem("input-file") || undefined,
            filters: [{
                name: "csv",
                extensions: ["csv"]
            }]
        });
        if (Array.isArray(selected)) {
            console.log(selected)
        } else if (selected === null) {
            console.log(selected)
        } else {
            console.log('select', selected)
            localStorage.setItem("input-file", selected);
            props.onDrop(selected);
        }
    }

    return (
        <div
            class="bg-gray-100 p-8 text-center rounded-lg border-dashed border-2 border-gray-300 transition duration-300 ease-in-out transform"
            classList={{
                "border-blue-500": isHover(),
                "scale-105": isHover(),
                "shadow-md": isHover(),
            }}
            ref={dropzoneRef}
            onClick={handleFileInput}
        >
            <label class="cursor-pointer flex flex-col items-center space-y-2">
                <svg class="w-16 h-16 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                </svg>
                <span class="text-gray-600">拖拽文件到这里</span>
                <span class="text-gray-500">（或点击此处选择文件）</span>
            </label>
        </div>
    )
}
