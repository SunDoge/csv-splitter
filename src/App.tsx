import { Show, createEffect, createResource, createSignal, onCleanup, onMount } from "solid-js";
import { invoke } from "@tauri-apps/api/tauri";
import { open } from "@tauri-apps/api/dialog";
import { isPermissionGranted, requestPermission, sendNotification } from "@tauri-apps/api/notification";
import { UnlistenFn, listen } from "@tauri-apps/api/event";

function App() {
  const [numLines, setNumLines] = createSignal(parseInt(localStorage.getItem("num-lines") || "10"))
  const [numFiles, setNumFiles] = createSignal<number | undefined>()
  const [filePath, setFilePath] = createSignal<string>("");
  const [permissionGranted] = createResource(async () => {
    let permissionGranted = await isPermissionGranted();
    if (!permissionGranted) {
      const permission = await requestPermission();
      permissionGranted = permission === 'granted';
    }
    return permissionGranted;
  });
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
    }
  }

  const handleSplit = async () => {
    const numFiles = await invoke<number>("split_csv", {
      path: filePath(),
      numLines: numLines(),
    })
    setNumFiles(numFiles);


    if (permissionGranted()) {
      sendNotification({
        title: "csv splitter",
        body: `已拆分 ${numFiles} 个文件`
      })
    }
  }

  createEffect(() => {
    console.log('store num lines', numLines())
    localStorage.setItem("num-lines", numLines().toString());
  })

  createEffect(() => {
    if (filePath().length === 0) { return; }
    if (filePath().endsWith(".csv")) {
      handleSplit().catch(console.log)
    } else {
      console.log('not csv');
      sendNotification({
        title: "csv splitter",
        body: `文件 ${filePath()} 不是csv文件`
      })
    }
  })

  const unlistens: UnlistenFn[] = [];
  onMount(async () => {
    console.log('listen to file drop')
    unlistens.push(
      await listen("tauri://file-drop", async (event) => {
        const payload = event.payload as string[];
        console.log(payload)
        dropzoneRef?.classList.remove('border-blue-500', 'border-2');
        setFilePath(payload[0]);
      })
    )
    unlistens.push(
      await listen("tauri://file-drop-hover", (event) => {
        console.log('file-drop-hover')
        dropzoneRef?.classList.add('border-blue-500', 'border-2');
      })
    );
    unlistens.push(
      await listen("tauri://file-drop-cancelled", (event) => {
        console.log('file-drop-cancelled')
        dropzoneRef?.classList.remove('border-blue-500', 'border-2');
      })
    )
  })

  onCleanup(() => {
    unlistens.map((unlisten) => {
      unlisten();
    })
  })

  return (
    <div class="flex flex-col w-full p-9 space-y-8">
      <div class="w-full">
        <label class="block mb-2 font-medium text-gray-900">
          每个文件包含记录条数
        </label>
        <input
          type="number"
          class="w-full bg-gray-50 border border-gray-300 text-gray-900 rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5"
          value={numLines()}
          onChange={(e) => setNumLines(parseInt(e.target.value))}
        />
      </div>

      <div
        class="bg-gray-100 p-8 text-center rounded-lg border-dashed border-2 border-gray-300 hover:border-blue-500 transition duration-300 ease-in-out transform hover:scale-105 hover:shadow-md"
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
      <p>{numFiles() === undefined || `已拆分 ${numFiles()} 个文件`}</p>
    </div>
  );
}

export default App;
