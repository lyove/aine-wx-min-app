/**
 * ssml-demo page
 * Acceptance page for the read-only ssml-viewer component.
 * Feeds a full-feature sample SSML string (as produced by SSML-Editor-Vanilla).
 */
const SAMPLE = '<speak><p><prosody rate="slow" pitch="high"><phoneme ph="nǐ hǎo">你好</phoneme>，欢迎来到<phoneme ph="yīn yuè">音乐</phoneme>世界</prosody><break time="400ms" strength="strong"/>今天为大家带来<emphasis level="strong">重磅</emphasis>消息，<say-as interpret-as="date">2026年9月7日</say-as><hint text="教学释义：此处为演示提示">正式开始</hint>。</p><p>第二段：<prosody volume="loud">大声朗读</prosody><break/>结束。</p></speak>';

Page({
  data: {
    sample: SAMPLE,
  },
});
