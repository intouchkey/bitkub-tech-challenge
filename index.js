var originalFetch = require("isomorphic-fetch");
var fetch = require("fetch-retry")(originalFetch, {
  retries: 5,
  retryDelay: 2500,
});
// const prompt = require("prompt");

// prompt.start();

// prompt.get(["address"], function (err, result) {
//   if (err) {
//     return onErr(err);
//   }

//   const { address } = result;

//   fetch(
//     `https://api-ropsten.etherscan.io/api?module=account&action=tokentx&address=${address}&startblock=0&endblock=999999999&sort=asc&apikey=K7ST5DC6VP2Z5ZVWWD1IB3JDB5AHIEV274`
//   )
//     .then((res) => res.json())
//     .then((json) => detect(json[0]));
// });

const startAddress = "0xEcA19B1a87442b0c25801B809bf567A6ca87B1da";

let allTransactions = [];
let checkedAddresses = [];
let unCheckedAddresses = [];
const mapResult = {};

unCheckedAddresses.push(startAddress);

async function fetchAPI(address) {
  return new Promise((resolve, reject) => {
    fetch(
      `https://api-ropsten.etherscan.io/api?module=account&action=tokentx&address=${address}&startblock=0&endblock=999999999&sort=asc&apikey=1W8UKCDBQM3TA6CHCHPCMMFUY6W2V59G86`
    )
      .then((res) => res.json())
      .then((json) => {
        mapResult[address] = mapResult[address] || 0;

        json.result
          .filter((block) => {
            return block.tokenSymbol == "BKTC";
          })
          .forEach((block) => {
            if (block.from.toLowerCase() == address.toLowerCase()) {
              mapResult[address] -= parseInt(block.value / 1000000000000000000);
            } else {
              mapResult[address] += parseInt(block.value / 1000000000000000000);
            }
          });

        const filteredBlcoks = json.result.filter((block) => {
          return (
            block.tokenSymbol == "BKTC" &&
            block.from.toLowerCase() == address.toLowerCase()
          );
        });
        resolve(filteredBlcoks);
      })
      .catch((res) => {
        reject(res);
      });
  });
}

async function main() {
  while (unCheckedAddresses.length > 0) {
    console.log("Fetching ***");
    const address = unCheckedAddresses.pop();
    checkedAddresses.push(address);

    const res = await fetchAPI(address);
    allTransactions = [...allTransactions, ...res];

    const newAddresses = res
      .filter((block) => {
        return (
          !checkedAddresses.includes(block.to) &&
          !unCheckedAddresses.includes(block.to)
        );
      })
      .map((block) => {
        return block.to;
      });

    unCheckedAddresses = [...unCheckedAddresses, ...newAddresses];
  }

  console.log("OUTPUT 1 \n\n");
  let count = 1;
  allTransactions.forEach((block) => {
    printBlock(block, count);
    count += 1;
  });
  count = 1;
  console.log("\n\nOUTPUT 2 \n\n");
  for (const [key, value] of Object.entries(mapResult)) {
    console.log(`${count} ${key} ${value}`);
    count += 1;
  }
}

function printBlock(block, count) {
  console.log(
    `${count} ${block.hash} ${block.from} ${block.to} ${
      block.value / 1000000000000000000
    }`
  );
}

main();
