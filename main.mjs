import axios from "axios";
import { writeFileSync } from "fs";
import qs from "qs";

// 【可修改】搜索关键词
const keywords = "公寓";
// 【可修改】需要自动化检索几页，默认10页
const pageCount = 10;
// 【可修改】最低多少钱一个月
const minPrice = 400;
// 【可修改】最高多少钱一个月
const maxPrice = 1250;

// 租房信息临时序号
let fetchIndex = 1;
// 符合条件的租房信息
const rentItems = [];
for (var page = 1; page <= pageCount; page++) {
  try {
    let data = qs.stringify({
      areaid: "0",
      haspic: "0",
      keywords: `${keywords}`,
      page: `${page}`,
      publishTime: "0",
      sortid: "0",
    });
    let config = {
      method: "post",
      url: "https://c.vanpeople.com/ajax/pc/search.html",
      headers: {
        "sec-ch-ua":
          '" Not A;Brand";v="99", "Chromium";v="96", "Microsoft Edge";v="96"',
        DNT: "1",
        "sec-ch-ua-mobile": "?0",
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.110 Safari/537.36 Edg/96.0.1054.57",
        "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
        Accept: "application/json, text/javascript, */*; q=0.01",
        "X-Requested-With": "XMLHttpRequest",
        "sec-ch-ua-platform": '"Windows"',
      },
      data: data,
    };
    const response = await axios(config);
    if (response.status === 200 && response.data) {
      const { data: rdata } = response;
      const { status = "", msg = "" } = rdata;
      if (status !== "ok" || msg !== "ok") {
        console.error("response error", response);
        continue;
      }
      const { data: rentData } = rdata;
      const { list: lst, totalcount = "0" } = rentData;
      const totalCount = parseInt(totalcount, 10);
      if (!lst) {
        console.error("response error", response);
        continue;
      }
      for (let i = 0; i < lst.length; i++) {
        const item = lst[i];
        // 去重
        if (!rentItems.find((t) => t.id === item.id)) {
          const { formatposttime, price } = item;
          let { title = "" } = item;
          // 去除加粗标记
          title = title.replace("<b>", "");
          title = title.replace("</b>", "");
          item.title = title;
          console.log(`[${fetchIndex}]`, formatposttime, `$${price}`, title);
          rentItems.push(item);
          fetchIndex++;
        }
      }
      if (fetchIndex > totalCount) {
        break;
      }
    } else {
      console.error("response error", response);
      continue;
    }
  } catch (err) {
    console.error("request error", err);
    continue;
  }
}
console.log("--------------------------------------------------------");
console.log("【提示】拉取数据完毕，正在寻找符合条件的房子...");
rentItems.sort((a, b) => b.posttime - a.posttime);
// 最终结果信息序号
let resultIndex = 1;
for (let item of rentItems) {
  const { formatposttime, price, title, url } = item;
  if (price > maxPrice) {
    continue;
  }
  if (price < minPrice) {
    continue;
  }
  // 排除租客发的求租信息，要找的是房东发的租房信息
  if (!title || title.includes("求租")) {
    continue;
  }
  const fullURL = `https://c.vanpeople.com${url}`;
  console.log(`[${resultIndex}]`, formatposttime, `$${price}`, title, fullURL);
  resultIndex++;
}
// 简单保存结果到本地
var saveData = (items) => {
  writeFileSync("result.json", JSON.stringify(items));
};
saveData(rentItems);
