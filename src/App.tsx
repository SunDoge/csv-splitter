import { Show, createEffect, createSignal } from "solid-js";
import { invoke } from "@tauri-apps/api/tauri";
import { open } from "@tauri-apps/api/dialog";
import { isPermissionGranted, requestPermission, sendNotification } from "@tauri-apps/api/notification";

function App() {

  const [numLines, setNumLines] = createSignal(parseInt(localStorage.getItem("num-lines") || "10"))
  const [numFiles, setNumFiles] = createSignal<number | undefined>()
  const [filePath, setFilePath] = createSignal<string | undefined>();

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

    let permisionGranted = await isPermissionGranted();
    if (!permisionGranted) {
      const permission = await requestPermission();
      permisionGranted = permission === 'granted';
    }
    if (permisionGranted) {
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

  return (
    <div class="flex flex-col w-full">
      <button class="btn" onClick={handleFileInput}>打开文件</button>
      <p>{filePath() || ""}</p>
      
      <div class="form-control w-full max-w-xs">
        <label class="label">
          <span class="label-text">每个文件包含记录条数</span>
        </label>
        <input
          type="number"
          class="input input-bordered w-full max-w-xs"
          value={numLines()}
          onChange={(e) => setNumLines(parseInt(e.target.value))}
        />
      </div>

      <button
        class="btn"
        classList={{
          "btn-disabled": filePath() === undefined
        }}
        onClick={handleSplit}
      >
        拆分
      </button>
      <p>{numFiles() === undefined || `已拆分 ${numFiles()} 个文件`}</p>
    </div>
  );
}

export default App;
