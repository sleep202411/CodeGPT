/**
 * 代码知识库向量化脚本
 * 支持从代码文件、目录、网页等多种来源构建向量索引
 */
import { createOpenAI } from "@ai-sdk/openai";
import {
    PuppeteerWebBaseLoader
} from '@langchain/community/document_loaders/web/puppeteer';
import {
  embed
} from 'ai';
import "dotenv/config";
import { createClient } from '@supabase/supabase-js';
import * as path from 'path';
import * as fs from 'fs';
import {
    processCodeDirectory,
    readCodeFile,
    isCodeFile,
    getFileLanguage,
    CodeChunk
} from './lib/code-processor';
import { CodeTextSplitter } from './lib/code-processor';

const supabase = createClient(
    process.env.SUPABASE_URL ?? "",
    process.env.SUPABASE_KEY ?? ""
);

const openai = createOpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    baseURL: process.env.OPENAI_API_BASE_URL,
});

console.log('🚀 开始构建代码知识库向量索引...');

/**
 * 向量化代码块并存储到 Supabase
 */
async function vectorizeAndStore(chunks: CodeChunk[]) {
    console.log(`📦 开始处理 ${chunks.length} 个代码块...`);
    
    for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        
        try {
            // 生成 embedding
            const { embedding } = await embed({
                model: openai.embedding('text-embedding-3-small'),
                value: chunk.content
            });

            // 存储到 Supabase
            const { error } = await supabase.from("chunks").insert({
                content: chunk.content,
                vector: embedding,
                file_path: chunk.filePath,
                url: chunk.filePath, // 兼容原有字段
                language: chunk.language,
                metadata: {
                    startLine: chunk.startLine,
                    endLine: chunk.endLine,
                    ...chunk.metadata
                }
            });

            if (error) {
                console.error(`❌ 存储失败 [${chunk.filePath}]:`, error);
            } else {
                if ((i + 1) % 10 === 0) {
                    console.log(`✅ 已处理 ${i + 1}/${chunks.length} 个代码块`);
                }
            }
        } catch (error) {
            console.error(`❌ 处理失败 [${chunk.filePath}]:`, error);
        }
    }
    
    console.log(`✨ 完成！共处理 ${chunks.length} 个代码块`);
}

/**
 * 从网页加载内容
 */
async function scrapePage(url: string): Promise<string> {
    try {
        const loader = new PuppeteerWebBaseLoader(url, {
            launchOptions: {
                headless: true,
            },
            gotoOptions: {
                waitUntil: 'networkidle0',
            },
            evaluate: async (page, browser) => {
                const result = await page.evaluate(() => document.body.innerText);
                await browser.close();
                return result;
            }
        });
        return await loader.scrape();
    } catch (error) {
        console.error(`网页抓取失败 [${url}]:`, error);
        return '';
    }
}

/**
 * 从网页加载代码文档
 */
async function loadFromWebpages(urls: string[]) {
    console.log('🌐 开始从网页加载代码文档...');
    const splitter = new CodeTextSplitter(1000, 200);
    const allChunks: CodeChunk[] = [];

    for (const url of urls) {
        console.log(`📄 处理网页: ${url}`);
        const content = await scrapePage(url);
        
        if (content) {
            const chunks = await splitter.splitCodeFile(content, url, 'Text');
            allChunks.push(...chunks);
        }
    }

    await vectorizeAndStore(allChunks);
}

/**
 * 从代码文件加载
 */
async function loadFromCodeFiles(filePaths: string[]) {
    console.log('📁 开始从代码文件加载...');
    const splitter = new CodeTextSplitter(1000, 200);
    const allChunks: CodeChunk[] = [];

    for (const filePath of filePaths) {
        if (!fs.existsSync(filePath)) {
            console.warn(`⚠️  文件不存在: ${filePath}`);
            continue;
        }

        const stat = await fs.promises.stat(filePath);
        
        if (stat.isDirectory()) {
            console.log(`📂 处理目录: ${filePath}`);
            const chunks = await processCodeDirectory(filePath, true);
            allChunks.push(...chunks);
        } else if (stat.isFile() && isCodeFile(filePath)) {
            console.log(`📄 处理文件: ${filePath}`);
            const content = await readCodeFile(filePath);
            const language = getFileLanguage(filePath);
            const chunks = await splitter.splitCodeFile(content, filePath, language);
            allChunks.push(...chunks);
        }
    }

    await vectorizeAndStore(allChunks);
}

// 主函数
async function main() {
    // 配置数据源
    // 1. 代码文件/目录（示例路径，请根据实际情况修改）
    const codePaths = [
        // './examples',  // 示例代码目录
        // './src',       // 源代码目录
        // './lib',       // 库文件目录
    ];

    // 2. 代码文档网页（可选）
    const codeDocUrls = [
        // 'https://docs.python.org/3/tutorial/',
        // 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide',
        // 'https://www.typescriptlang.org/docs/',
    ];

    if (codePaths.length > 0) {
        await loadFromCodeFiles(codePaths);
    }

    if (codeDocUrls.length > 0) {
        await loadFromWebpages(codeDocUrls);
    }

    if (codePaths.length === 0 && codeDocUrls.length === 0) {
        console.log('ℹ️  请在 seed.ts 中配置代码文件路径或文档 URL');
        console.log('   示例:');
        console.log('   const codePaths = ["./examples", "./src"];');
        console.log('   const codeDocUrls = ["https://docs.python.org/3/tutorial/"];');
    }
}

// 运行
main().catch(console.error);
