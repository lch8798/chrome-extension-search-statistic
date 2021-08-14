import {
  fetchData,
  parseKeywordInfos,
  getCurrentSearchKeyword,
  renderParseKeywordInfos,
} from "./apiTest2.js";

function main() {
  initApp();
  // initEventListeners();
}
main();

// set app
async function initApp() {
  //   async function setButtonValue() {
  //     const color = await utils.storage.get("color");
  //     const changeColorButtonValueEl = document.querySelector(
  //       ".set-background-color-button .set-background-color-button__value"
  //     );
  //     changeColorButtonValueEl.textContent = color;
  //   }
  //   setButtonValue();

  // fetch search keyword statistic
  async function fetchSearchKeywordStatistic(keyword) {
    const result = await fetchData("GET", "/keywordstool", {
      hintKeywords: encodeURI(keyword.replace(" ", "")),
      showDetail: 1,
    });

    return parseKeywordInfos(result.keywordList);
  }

  async function initData() {
    // get search keyword
    const keyword = await getCurrentSearchKeyword();
    if (!Boolean(keyword)) {
      document.querySelector(".keyword").textContent =
        "카러쉬 화이팅, 근데 여긴 아니야.";

      document.querySelector(".table-wrap").innerHTML = `
                <a class="link" href="https://naver.com" target="_blank">네이버 바로가기</a>
            `;
      return;
    }

    // get keyword statistic data
    const keywordInfos = await fetchSearchKeywordStatistic(keyword);

    // render
    console.log(keyword, keywordInfos);
    document.querySelector(".keyword").textContent = keyword;
    renderParseKeywordInfos(".table-wrap", keywordInfos);
  }
  initData();
}

// set event listeners
// function initEventListeners() {
//   // change color button
//   utils.event.attachEventToCurrentWindow(
//     ".set-background-color-button",
//     "click",
//     async (e) => {
//       const color = await utils.storage.get("color");

//       return () => {
//         document.body.style.backgroundColor = color;
//       };
//     }
//   );

//   // clear screen
//   utils.event.attachEventToCurrentWindow(
//     ".clear-screen-button",
//     "click",
//     (e) => () => {
//       document.body.remove();
//     }
//   );
// }

// // # Extension
// // on
// let userMoveQueueIdx = 0;
// window.addEventListener('message', (data) => {
//     postMessage(fetch('userInfo', data.id), userMoveQueueIdx);

//     userMoveQueueIdx++;
// });

// // # Web
// let userMoveQueueIdx = 0;
// const userMoveQueue = [{ id: 0,  func: () => null }];

// // emit
// postMessage({ data: 2, idx: userMoveQueueIdx++ });

// // on
// window.addEventListener('message', (data) => {
//     userMoveQueue.push({ id: userMoveQueueIdx, userIdx, func: () => {
//         users[data.idx] = data.user;
//     }});
//     userMoveQueue.sort((a, b) => a - b);
//     executeQueue();
// });

// function executeQueue() {
//     if(userMoveQueueIdx !== userMoveQueue[0].id) return;

//     userMoveQueue[0].func();
//     prevUserMoveQueueIdx = userMoveQueue[0].id;
//     userMoveQueue.shift();
// }
