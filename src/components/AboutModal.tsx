import { Component, Show, createResource } from "solid-js";

import { getName, getVersion } from "@tauri-apps/api/app";

export const AboutModal: Component<{
  isOpen: boolean,
  onClose: () => void
}> = (props) => {

  const [appVersion] = createResource(getVersion);
  const [appName] = createResource(getName);

  return (
    <Show when={props.isOpen}>
      <div class="fixed w-full h-100 inset-0 z-50 overflow-hidden flex justify-center items-center"
        style="background: rgba(0,0,0,.7);">
        <div
          class="border bg-white w-11/12 md:max-w-md mx-auto rounded shadow-lg z-50 overflow-y-auto">
          <div class="modal-content py-4 text-left px-6">
            {/* <!--Title--> */}
            <div class="flex justify-between items-center pb-3">
              <p class="text-xl font-bold">{appName()}</p>
              <div class="modal-close cursor-pointer z-50"
                onClick={props.onClose}
              >
                <svg class="fill-current text-black" xmlns="http://www.w3.org/2000/svg" width="18" height="18"
                  viewBox="0 0 18 18">
                  <path
                    d="M14.53 4.53l-1.06-1.06L9 7.94 4.53 3.47 3.47 4.53 7.94 9l-4.47 4.47 1.06 1.06L9 10.06l4.47 4.47 1.06-1.06L10.06 9z">
                  </path>
                </svg>
              </div>
            </div>
            {/* <!--Body--> */}
            <div class="my-5">
              <p>Version: {appVersion()}</p>
              <p>Author: <a class="text-blue-600" href="https://github.com/SunDoge" target="__blank">@SunDoge</a></p>
              <p>Source Code: <a class="text-blue-600" href="https://github.com/SunDoge/csv-splitter" target="__blank">SunDoge/csv-splitter</a></p>
            </div>
            {/* <!--Footer--> */}
            {/* <div class="flex justify-end pt-2">
            <button
              class="focus:outline-none modal-close px-4 bg-gray-400 p-3 rounded-lg text-black hover:bg-gray-300">Cancel</button>
            <button
              class="focus:outline-none px-4 bg-teal-500 p-3 ml-3 rounded-lg text-white hover:bg-teal-400">Confirm</button>
          </div> */}
          </div>
        </div>
      </div>
    </Show>
  )
}
