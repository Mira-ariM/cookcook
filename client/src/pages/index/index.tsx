// 首页 — 场景选择入口
import { View, Text } from '@tarojs/components';
import Taro from '@tarojs/taro';
import './index.scss';

const SCENARIOS = [
  { key: 'random', label: '🎲 随机搭配一顿饭', desc: '选结构，系统帮你配' },
  { key: 'fridge', label: '🧊 冰箱里有这些', desc: '输入食材，消灭库存' },
  { key: 'leftovers', label: '🍱 剩菜改造', desc: '昨晚的剩菜变身新花样' },
  { key: 'favorites', label: '⭐ 从收藏里搭配', desc: '常做的菜组合一下' },
  { key: 'repeat', label: '🔄 复刻最近吃过的', desc: '上次那顿再来一次' },
];

export default function Index() {
  const handleScenario = (scenario: string) => {
    Taro.navigateTo({ url: `/pages/scenario/scenario?type=${scenario}` });
  };

  return (
    <View className='home'>
      <View className='home-header'>
        <Text className='home-title'>今天吃什么？</Text>
        <Text className='home-subtitle'>帮你们搭一顿饭 💕</Text>
      </View>
      <View className='scenario-list'>
        {SCENARIOS.map(s => (
          <View key={s.key} className='scenario-card' onClick={() => handleScenario(s.key)}>
            <Text className='scenario-label'>{s.label}</Text>
            <Text className='scenario-desc'>{s.desc}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}
