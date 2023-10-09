import { JSX, createEffect, createSignal, onCleanup, onMount } from "solid-js";
import { invoke } from "@tauri-apps/api/tauri";
import { open } from "@tauri-apps/api/dialog";
import { UnlistenFn, listen } from "@tauri-apps/api/event";
import toast, { Toaster } from "solid-toast"

function App() {
  const [numLines, setNumLines] = createSignal<string>(localStorage.getItem("num-lines") || "10")
  const [filePath, setFilePath] = createSignal<string>("");
  const [isHover, setIsNover] = createSignal(false);
  let dropzoneRef: HTMLDivElement | undefined;

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
      localStorage.setItem("input-file", selected);
      setFilePath(selected);
      await handleSplit();
    }
  }

  const handleInputNumLines: JSX.EventHandler<HTMLInputElement, InputEvent> = (event) => {
    const value = event.currentTarget.value;
    console.log('input value', value)
    if (value.match('^[0-9]+$')) {
      setNumLines(value);
    } else {
      event.currentTarget.value = numLines()
    }
  }

  const handleSplit = async () => {
    if (!filePath().endsWith(".csv")) {
      toast.error(`文件 ${filePath()} 不是csv文件`);
      return;
    }

    await toast.promise(
      invoke<number>("split_csv", {
        path: filePath(),
        numLines: parseInt(numLines()),
      }),
      {
        loading: "正在拆分",
        success: (numFiles) => (
          <span>已拆分 {numFiles} 个文件</span>
        ),
        error: (
          <span>拆分失败</span>
        )
      }
    );
  }

  createEffect(() => {
    console.log('store num lines', numLines())
    localStorage.setItem("num-lines", numLines().toString());
  })

  const unlistens: UnlistenFn[] = [];
  onMount(async () => {
    console.log('listen to file drop')
    unlistens.push(
      await listen("tauri://file-drop", async (event) => {
        const payload = event.payload as string[];
        console.log(payload)
        setIsNover(false);
        setFilePath(payload[0]);
        await handleSplit()
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

  return (
    <>
      <div class="flex flex-col w-full h-screen p-4 space-y-8 justify-center">
        <div class="w-full">
          <label class="block mb-2 font-medium text-gray-900">
            每个文件包含记录条数：
          </label>
          <input
            type="number"
            min="1"
            class="w-full bg-gray-50 border border-gray-300 text-gray-900 rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2"
            value={numLines()}
            onInput={handleInputNumLines}
          />
        </div>

        <div
          class="bg-gray-100 p-8 text-center rounded-lg border-dashed border-2 border-gray-300 transition duration-300 ease-in-out transform hover:border-blue-500 hover:scale-105 hover:shadow-sm"
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
      </div>
      <Toaster position="top-center" />
    </>
  );
}

export default App;
