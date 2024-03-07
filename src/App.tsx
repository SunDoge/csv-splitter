import { createEffect, createSignal, JSX, Show, Switch } from "solid-js";
import { invoke } from "@tauri-apps/api/tauri";
import toast, { Toaster } from "solid-toast"
import { HiOutlineQuestionMarkCircle } from "./components/QuestionMark";
import { AboutModal } from "./components/AboutModal";
import { Dropzone } from "./components/Dropzone";
import createMaskedInput from "./components/IMask";
import { ask } from "@tauri-apps/api/dialog";

const NumberInput = createMaskedInput({
  mask: Number,
  min: 1,
  thousandsSeparator: ","
})

function App() {
  const [numLines, setNumLines] = createSignal<string>(
    localStorage.getItem("num-lines") || "1000000"
  )
  // 默认为true
  const [withHeader, setWithHeader] = createSignal<boolean>(
    localStorage.getItem('with-header') !== 'false'
  )
  const [numHeaderLines, setNumHeaderLines] = createSignal<string>(
    localStorage.getItem("num-header-lines") || "1"
  )
  const [filePath, setFilePath] = createSignal<string>("", { equals: false });
  const [isModalOpen, setIsModalOpen] = createSignal(false);

  const handleSplit = async () => {
    if (filePath().length === 0) {
      toast.error("请选择合法文件");
      return;
    }
    const parsedNumLines = parseInt(numLines());
    if (Number.isNaN(parsedNumLines)) {
      toast.error("请输入合法的记录条数");
      return;
    }
    if (parsedNumLines < 100) {
      const yes = await ask("每个文件小于100条记录会创建大量文件，确定继续吗？", {
        title: "是否继续拆分？",
        type: "warning"
      });
      if (!yes) {
        return;
      }
    }

    const paredNumHeaderLines = parseInt(numHeaderLines());
    if (Number.isNaN(paredNumHeaderLines)) {
      toast.error("请输入合法的表头行数");
      return;
    }

    if (!filePath().endsWith(".csv")) {
      toast.error(`文件 ${filePath()} 不是csv文件`);
      return;
    }

    await toast.promise(
      invoke<number>("split_csv", {
        path: filePath(),
        numLines: parsedNumLines,
        numHeaderLines: withHeader() ? parsedNumLines : 0,
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
    localStorage.setItem("num-lines", numLines().toString());
  })

  createEffect(() => {
    localStorage.setItem("with-header", withHeader().toString());
  })

  return (
    <>
      <button class="absolute top-1 right-1 text-gray-400"
        onClick={() => setIsModalOpen(true)}
      >
        <HiOutlineQuestionMarkCircle />
      </button>
      <div class="flex flex-col w-full h-screen p-4 space-y-4 justify-center">
        <div>
          <label class="block mb-2 font-semibold">
            每个文件包含记录条数：
          </label>
          <NumberInput
            class="w-full bg-gray-50 border border-gray-300 text-gray-900 rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2"
            onAccept={({ unmaskedValue }, _maskRef, _e) => {
              setNumLines(unmaskedValue);
            }}
            value={numLines()}
          />
        </div>

        <div class="inline-flex items-center mt-2">
          <input type="checkbox" class="h-5 w-5" checked={withHeader()} onChange={(e) => {
            setWithHeader(e.currentTarget.checked)
          }} />
          <span class="ml-2 font-semibold">跳过表头</span>
        </div>

        <div>
          <Show when={withHeader()} >
            <label class="block mb-2 font-semibold">
              表头行数：
            </label>
            <NumberInput
              class="w-full bg-gray-50 border border-gray-300 text-gray-900 rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2"
              onAccept={({ unmaskedValue }, _maskRef, _e) => {
                setNumHeaderLines(unmaskedValue);
              }}
              value={numHeaderLines()}
            />
          </Show>
        </div>

        <Dropzone onDrop={(path) => {
          setFilePath(path);
          handleSplit().catch((e) => {
            console.log(e);
          })
        }} />
      </div>
      <Toaster position="top-center" />
      <AboutModal isOpen={isModalOpen()} onClose={() => setIsModalOpen(false)} />
    </>
  );
}

export default App;
