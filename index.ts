import { HermesClient } from "@pythnetwork/hermes-client";
import { PYTH_CONTRACT_ABI, PYTH_CONTRACT_ADDRESS_SEPOLIA } from "@pythnetwork/pyth-fuel-js";
import { arrayify, Contract, hexlify, Provider, Wallet } from "fuels";

const NODE_URL = "https://testnet.fuel.network/v1/graphql";
const provider = await Provider.create(NODE_URL);

const wallet = Wallet.fromPrivateKey("0x88ffaf1bede226df6a392e62de152ed2c8b4263c7f77447a3acbef3a5779da79", provider);

const contract = new Contract(
    PYTH_CONTRACT_ADDRESS_SEPOLIA,
    PYTH_CONTRACT_ABI,
    wallet
);

const HERMES_URL = "https://hermes.pyth.network/"
const FUEL_ETH_BASE_ASSET_ID = "0xf8f8b6283d7fa5b672b530cbb84fcccb4ff8dc40f8176ef4544ddb1f1952ad07";

const client = new HermesClient(HERMES_URL);

const PRICE_FEED_IDS = [
    "0xff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace", // ETH
    "0xeaa020c61cc479712813461ce153894a96a6c00b21ed0cfc2798d1f9a9e9c94a", // USDC
    "0xe62df6c8b4a85fe1a67db44dc12de5db330f7ac66b72dc658afedf0f4a415b43", // BTC
    "0x78d185a741d07edb3412b09008b7c5cfb9bbbd7d568bf00ba737b456ba171501" // UNI
];

const priceUpdates = await client.getLatestPriceUpdates(
    PRICE_FEED_IDS,
);

const updateData = Buffer.from(priceUpdates.binary.data[0], "hex");

// Get the fee
const { waitForResult: waitForResultFee } = await contract.functions
    .update_fee([arrayify(updateData)])
    .call();

const { value: fee } = await waitForResultFee();

// Update the price feeds
await contract.functions
    .update_price_feeds([arrayify(updateData)])
    .callParams({
        forward: [fee, hexlify(FUEL_ETH_BASE_ASSET_ID)],
    })
    .call();

// Print the price of each asset
for (const priceFeedId of PRICE_FEED_IDS) {
    const { value: price } = await contract.functions
        .get_price(hexlify(priceFeedId))
        .get();
    console.log(priceFeedId, price);
}
