# AIGC

AIGC（AI Generated Content）相关教程，包括 ComfyUI、Stable Diffusion、图生视频等。

## 内容

- [ComfyUI 图文视频生成教程](./comfyui) — ComfyUI 安装、工作流搭建、面试题

## ComfyUI 图文视频生成教程

ComfyUI 是一个基于**节点工作流**的 AI 图像/视频生成工具。你把不同的功能模块（节点）拖到画布上连起来，组成一个流程，就能生成图片和视频。和 WebUI 那种填表单的方式不同，ComfyUI 更灵活，适合做复杂的工作流。

---

## 一、ComfyUI 是什么？

### 和 WebUI 的区别

| 对比 | WebUI | ComfyUI |
|------|-------|---------|
| 操作方式 | 点按钮、填表单 | 拖拽节点、连线搭流程 |
| 灵活度 | 固定页面，不能自定义 | 节点可任意组合，灵活度高 |
| 学习成本 | 低，开箱即用 | 稍高，需要理解节点逻辑 |
| 适合人群 | 新手、快速出图 | 进阶用户、做复杂工作流 |
| 资源占用 | 较高 | 较低，可复用小显存 |
| 批量处理 | 较弱 | 强，节点可自由编排 |

---

## 二、安装 ComfyUI

### 本地安装

**Windows/Linux/Mac**：

```bash
git clone https://github.com/comfyanonymous/ComfyUI.git
cd ComfyUI

# 装依赖
pip install -r requirements.txt

# 启动
python main.py
```

启动后浏览器打开 `http://127.0.0.1:8188` 就能看到 ComfyUI 界面。

### 装模型

模型下载后放到对应目录：

```
ComfyUI/
├── models/
│   ├── checkpoints/       # 大模型（SD1.5/SDXL/SD3）
│   ├── vae/               # VAE 模型
│   ├── loras/             # Lora 模型
│   ├── controlnet/        # ControlNet 模型
│   ├── upscale_models/    # 放大模型
│   └── animatediff_models/# 视频模型
```

模型去哪里下载？推荐几个地方：

- [Civitai](https://civitai.com) — 最大的模型社区
- [Hugging Face](https://huggingface.co) — 搜 Stable Diffusion 模型
- 国内镜像：hf-mirror.com

### 云端使用

不想本地装的话，可以用在线平台：

- [ComfyUI Online](https://comfyui.cloud)
- [RunComfy](https://www.runcomfy.com)
- 阿里云/腾讯云的 GPU 实例自己部署

---

## 三、第一个工作流：文生图

### 认识界面

打开 ComfyUI 后，你会看到一个空白的画布，右侧有节点菜单。画布操作：

- **右键** → 添加节点
- **拖拽连线** → 连接节点
- **双击空白处** → 搜索节点
- **删除** → 选中节点按 Delete

### 最简单的文生图工作流

一个最基本的文生图工作流需要 4 个节点：

```
[Checkpoint Loader] → [CLIP Text Encode] → [KSampler] → [VAE Decode] → [Save Image]
                                           ↑
                                     [Empty Latent Image]
```

**逐节点说明**：

1. **Load Checkpoint** — 加载大模型（比如 SDXL 或 SD1.5 的模型文件）
2. **CLIP Text Encode** — 把文字提示词转换成模型能理解的向量。需要两个：正面提示词和负面提示词
3. **Empty Latent Image** — 创建一个空白画布，设置宽高和 batch 数量
4. **KSampler** — 核心采样器，控制生成过程。关键参数：
   - seed：随机种子，同样的种子每次生成一样的结果
   - steps：步数，一般 20-30 步就够了
   - cfg：提示词相关性，一般 7-8
   - sampler_name：采样器名称（如 Euler、DPM++ 2M Karras）
   - scheduler：调度器
   - denoise：降噪强度，图生图用
5. **VAE Decode** — 把潜空间的数据解码成图片
6. **Save Image** — 保存图片到本地

**操作步骤**：
1. 右键添加 `Load Checkpoint`，选一个模型
2. 添加 `CLIP Text Encode`，输入 `a cat wearing a hat, photorealistic`
3. 再添加一个 `CLIP Text Encode`，输入 `blurry, ugly, distorted`（负面提示词）
4. 添加 `Empty Latent Image`，设置宽高 1024x1024
5. 添加 `KSampler`，设置 seed 为随机数，steps 20，cfg 7
6. 添加 `VAE Decode`
7. 添加 `Save Image`
8. 把节点按上面的流程连起来

连好之后点击 **Queue Prompt**（或按 `Ctrl+Enter`），等一会儿就能看到生成的图片。

---

## 四、图生图

图生图就是把一张现有的图片，按你的提示词重新生成。

### 工作流

和文生图类似，但增加一个 `Load Image` 节点，并把图片输入到 KSampler 的 `latent_image` 输入口。

```
[Load Image] → [VAE Encode] ─────────┐
                                     ├→ [KSampler] → [VAE Decode] → [Save Image]
[Checkpoint Loader] → [CLIP Text Encode] ←─┘
                     [CLIP Text Encode]（负面）
```

关键参数：`denoise`（降噪强度）= 0.3~0.7

- denoise 越小，越接近原图
- denoise 越大，AI 发挥空间越大

---

## 五、视频生成

视频生成主要靠 **AnimateDiff** 插件。它能在 Stable Diffusion 的基础上生成连贯的帧序列。

### 安装 AnimateDiff

```bash
cd ComfyUI/custom_nodes
git clone https://github.com/Kosinkadink/ComfyUI-AnimateDiff-Evolved.git
```

重启 ComfyUI 后在节点列表里就能看到 AnimateDiff 相关节点。

### 视频生成工作流

```
[Load Checkpoint] → [CLIP Text Encode] → [AnimateDiff Loader] → [KSampler] → [VAE Decode] → [Video Combine]
                                           ↑
                                     [Empty Latent Image]（设置 batch_size = 帧数）
```

**关键节点**：
- **AnimateDiff Loader** — 加载 AnimateDiff 运动模块
- **Video Combine** — 把生成的帧图片合并成视频文件（MP4 或 GIF）

**参数说明**：
- `batch_size`：总帧数，16 帧大概生成 1 秒视频
- `steps`：每帧的采样步数
- `seed`：所有帧用同一个种子，保证连贯性

### 视频控制的进阶方法

- **ControlNet 结合 AnimateDiff**：用 OpenPose 控制人物姿态，逐帧输入姿态序列
- **IP-Adapter**：用参考图控制整体风格
- **LoRA**：用特定风格/人物的 LoRA 模型

---

## 六、常用节点介绍

### Checkpoint（大模型）

文生图、图生图的基础模型。常见的几类：

| 模型系列 | 特点 | 适用场景 |
|---------|------|---------|
| SD 1.5 | 兼容性好、资源多 | 普通图片、二次元 |
| SDXL | 质量高、1024x1024 | 高质量图片 |
| SD 3 / Flux | 最新、效果最好 | 商业级图片，但显存要求高 |
| Playground v2 | 美学评分高 | 创意设计 |

### LoRA

轻量级的微调模型，可以给图片加上某种风格或人物特征。

- 权重一般 0.5~1.0，太高容易过拟合
- 多个 LoRA 可以叠加使用

### ControlNet

精确控制生成内容的结构：

| ControlNet 类型 | 作用 |
|----------------|------|
| Canny | 边缘检测，控制轮廓 |
| Depth | 深度图，控制空间结构 |
| OpenPose | 姿态检测，控制人物姿势 |
| Scribble | 涂鸦，自由控制构图 |
| Lineart | 线稿上色 |

### IP-Adapter

用一张参考图来控制生成的风格或内容。

- **风格迁移**：输入一张风格图，生成同样风格的图片
- **内容参考**：输入一张人脸，生成同样的人

### VAE

负责压缩和解压图片。好的 VAE 能让颜色更鲜艳、细节更丰富。

---

## 七、工作流优化技巧

### 显存不够怎么办？

- 使用 `--lowvram` 参数启动：`python main.py --lowvram`
- 关掉不需要的节点
- 图片分辨率不要太大
- 用 SD 1.5 代替 SDXL（显存占用少一半）

### 出图太慢怎么办？

- 减少 steps（20 步就够）
- 用 smaller 模型
- 开启 xformers 或 TensorRT 加速
- batch 一次性多生成几张

### 出图质量不好怎么办？

- 换 checkpoints（模型质量是关键）
- 加负面提示词（bad quality, blurry, ugly, distorted）
- 用高质量的 VAE
- 开启 Hires.fix（先生成小图再放大）
- 加 refiner（SDXL 的优化器）

### 如何复现一张图？

- 保存 workflow：ComfyUI 的 workflow 信息是嵌在图片里的
- 把图片拖回 ComfyUI，会自动还原整个工作流
- 也可以用 API 模式调用，方便集成到代码里

---

## 八、ComfyUI 常用快捷键

| 快捷键 | 功能 |
|--------|------|
| Ctrl+Enter | 执行工作流 |
| Ctrl+Shift+拖拽 | 框选多个节点 |
| Ctrl+C / Ctrl+V | 复制粘贴节点 |
| Ctrl+D | 禁用选中节点 |
| Delete | 删除节点 |
| 空格+拖拽 | 平移画布 |
| 滚轮 | 缩放画布 |
| 双击空白 | 搜索添加节点 |

---

## 九、常见面试问题

### 1. Stable Diffusion 的原理是什么？

SD 是一种**潜在扩散模型（LDM）**。它不是在像素空间直接生成图片，而是先通过 VAE 把图片压缩到潜空间，在潜空间做扩散/去噪，再用 VAE 解码回图片。这样做的好处是大幅降低了计算量。

核心流程：
```
正向：图片 → VAE编码 → 逐步加噪声 → 纯噪声
反向：纯噪声 → 逐步去噪（UNet） → VAE解码 → 图片
```

### 2. Checkpoint、LoRA、Hypernetwork 有什么区别？

| 类型 | 大小 | 训练方式 | 使用方式 |
|------|------|---------|---------|
| Checkpoint | 2-7GB | 全量微调 | 直接加载作为基础模型 |
| LoRA | 10-200MB | 低秩适配矩阵 | 叠加在 checkpoint 上 |
| Textual Inversion | 几 KB | 学习新的 token | 以提示词方式调用 |

### 3. CLIP 在 SD 中的作用是什么？

CLIP 负责把文本提示词转换成**文本嵌入（text embeddings）**，UNet 在去噪过程中用这个嵌入来指导生成方向。它连接了自然语言和图像特征空间。

### 4. CFG Scale 是什么？

CFG（Classifier Free Guidance）scale 控制提示词对生成结果的影响强度：
- 值越小（1-3），AI 自由发挥空间越大，可能偏离提示词
- 值越大（10-15），越严格遵循提示词，但可能过饱和、不自然
- 默认值 7-8，大部分场景适用

### 5. 什么是 VAE？为什么要换 VAE？

VAE 是编码解码器，把像素图和潜空间数据来回转换。好的 VAE 能保留更多细节、颜色更准确、人脸更好看。常见的优质 VAE 包括 vae-ft-mse-840000 和 SDXL VAE。

### 6. 什么是采样器（Sampler）？常见的有哪些？

采样器是去噪过程的算法，决定了从噪声到清晰图片的路径。

| 采样器 | 速度 | 质量 | 适用场景 |
|--------|------|------|---------|
| Euler | 快 | 好 | 通用 |
| DPM++ 2M Karras | 中等 | 很好 | 高质量出图 |
| DDIM | 快 | 好 | 图生图 |
| LMS | 中等 | 好 | 老牌经典 |
| UniPC | 快 | 好 | 快速出图 |

### 7. 什么是 AnimateDiff？它是怎么工作的？

AnimateDiff 在预训练的 SD 模型上插入**运动模块（Motion Module）**，让模型生成多帧之间连贯的序列。它不改变 SD 的结构，而是在 UNet 中加入了时序注意力层，让每一帧的生成参考前后帧的信息。

### 8. ControlNet 的原理是什么？

ControlNet 是一个**条件控制网络**，把外部条件（边缘图、深度图、姿态图等）作为额外输入注入到 UNet 中。它复制 UNet 的 encoder 部分作为"控制分支"，通过零卷积层融合到主网络中。这样不破坏原始模型能力，又增加了外部控制。

### 9. AIGC 目前有哪些落地场景？

- **电商**：商品图生成、模特换装、背景替换
- **游戏**：角色立绘、场景概念图、UI 素材
- **影视**：前期概念设计、后期特效辅助、视频转绘
- **设计**：海报生成、LOGO 设计、包装设计
- **社交媒体**：头像生成、滤镜效果、创意内容
- **教育**：课件配图、教学视频生成

### 10. 你对 AIGC 未来的看法？

AIGC 的未来方向：
- **可控性增强**：从粗糙生成走向精确控制
- **视频领域爆发**：Sora 等模型出现，视频生成会是下一个增长点
- **3D 生成**：从图片、视频走向 3D 资产生成
- **端侧部署**：模型变小，手机本地就能跑
- **与传统工作流融合**：AIGC 变成设计师/开发者的辅助工具，而不是替代
