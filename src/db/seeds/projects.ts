import { db } from '@/db';
import { projects } from '@/db/schema';

async function main() {
    const sampleProjects = [
        {
            title: "Smart Document Analyzer",
            description: "Revolutionize document processing with our AI-powered Smart Document Analyzer. This cutting-edge application leverages natural language processing (NLP) algorithms to extract meaningful insights from unstructured documents. The system automatically detects document types, extracts key information, and provides intelligent suggestions for further actions. Features include automated document classification using deep learning models with 95% accuracy, intelligent text extraction for PDFs and images using OCR and NLP, real-time document similarity search to avoid duplication, multilingual support with 25+ languages, sentiment analysis, named entity extraction and semantic search capabilities using transformer embeddings.",
            repoUrl: 'https://github.com/archishman-dey/document-analyzer',
            nftBadgeUrl: null,
            ipfsCid: 'QmeP4rD5r4E5s5d4j2F5i4H2q3g3J4k4M5n6o7P8q8r9S',
            ipfsUrl: 'https://ipfs.io/ipfs/QmeP4rD5r4E5s5d4j2F5i4H2q3g3J4k4M5n6o7P8q8r9S/smart_document_analyzer.pdf',
            ipfsPinned: 1,
            assetName: 'smart_document_analyzer.pdf',
            assetSize: 2048000,
            createdAt: Date.now() - 86400000 * 7, // 1 week ago
            updatedAt: Date.now() - 86400000 * 2, // 2 days ago
        },
        {
            title: "IoT Weather Station",
            description: "Build an entire Internet-of-Things ecosystem with our IoT Weather Station project, a hands-on journey through embedded computing, wireless communication and sensor calibration to create a real-time weather monitoring system using C, Python and cloud computing techniques. Develop firmware for ESP32 microcontrollers to collect sensor data from BME280 sensors with custom calibration routines. Implement MQTT on Wi-Fi and LoRa for mesh networking edge devices. Securely transmit data via MQTT using mutual TLS and Azure IoT Hub. Visualize real-time data on a web dashboard built with React and chart libraries.",
            repoUrl: 'https://github.com/archishman-dey/iot-weather',
            nftBadgeUrl: null,
            ipfsCid: 'QmnD3rD6r7E8s6d5j2F6i5H3q4g4K5L6M7n6o8P9r9q8d',
            ipfsUrl: 'https://ipfs.io/ipfs/QmnD3rD6r7E8s6d5j2F6i5H3q4g4K5L6M7n6o8P9r9q8d/iot_weather_firmware.bin',
            ipfsPinned: 0,
            assetName: 'iot_weather_firmware.bin',
            assetSize: 512000,
            createdAt: Date.now() - 86400000 * 14, // 2 weeks ago
            updatedAt: Date.now() - 86400000 * 5, // 5 days ago
        },
        {
            title: "NFT Portfolio Tracker",
            description: "Manage your digital art investments efficiently with our NFT Portfolio Tracker, a decentralized application (DApp) designed specifically for collectors seeking real-time valuation, trend analysis, tax reporting, and portfolio metrics of Non-Fungible Tokens spanning marketplaces like OpenSea, Rarible, SuperRare, and LooksRare. The solution synchronizes metadata via TheGraph subgraphs and Moralis APIs. Integrate crypto wallets via Web3Connect including MetaMask, Ledger, WalletConnect, and Phantom. Price NFTs automatically using machine learning models powered by real-time blockchain exchange feeds and historical sales data.",
            repoUrl: 'https://github.com/archishman-dey/nft-tracker',
            nftBadgeUrl: 'https://opensea.io/assets/ethereum/0x123/456',
            ipfsCid: 'QmdG4rD7r7E9s7d8j3F7i6H4q5g5K6L7M8n7o9P0q0r9d',
            ipfsUrl: 'https://ipfs.io/ipfs/QmdG4rD7r7E9s7d8j3F7i6H4q5g5K6L7M8n7o9P0q0r9d/nft_portfolio_app.zip',
            ipfsPinned: 1,
            assetName: 'nft_portfolio_app.zip',
            assetSize: 15680000,
            createdAt: Date.now() - 86400000 * 3, // 3 days ago
            updatedAt: Date.now() - 86400000 * 1, // 1 day ago
        }
    ];

    await db.insert(projects).values(sampleProjects);
    console.log('✅ Projects seeder completed successfully');
}

main().catch((error) => {
    console.error('❌ Seeder failed:', error);
});