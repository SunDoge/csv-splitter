import { createEffect, createSignal, JSX } from "solid-js";
import { invoke } from "@tauri-apps/api/tauri";
import toast, { Toaster } from "solid-toast"
import { HiOutlineQuestionMarkCircle } from "./components/QuestionMark";
import { AboutModal } from "./components/AboutModal";
import { Dropzone } from "./components/Dropzone";

function App() {
  const [numLines, setNumLines] = createSignal<string>(localStorage.getItem("num-lines") || "10")
  const [filePath, setFilePath] = createSignal<string>("", { equals: false });
  const [isModalOpen, setIsModalOpen] = createSignal(false);

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
    if (filePath().length === 0) {
      return;
    }
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
    handleSplit().catch((e) => {
      console.log(e);
    })
  })

  createEffect(() => {
    console.log('store num lines', numLines())
    localStorage.setItem("num-lines", numLines().toString());
  })

  return (
    <>
      <button class="absolute top-1 right-1 text-gray-400"
        onClick={() => setIsModalOpen(true)}
      >
        <HiOutlineQuestionMarkCircle />
      </button>
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
        <Dropzone onDrop={(path) => {
          setFilePath(path);
        }} />
      </div>
      <Toaster position="top-center" />
      <AboutModal isOpen={isModalOpen()} onClose={() => setIsModalOpen(false)} />
    </>
  );
}

export default App;
