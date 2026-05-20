// 场景输入页 — 选饭菜结构 / 输入食材 / 选口味
import { useState } from 'react';
import { View, Text, Input, Button } from '@tarojs/components';
import Taro, { useRouter } from '@tarojs/taro';
import { generateMealPlans } from '../../services/api';
import './scenario.scss';

export default function Scenario() {
  const router = useRouter();
  const scenarioType = router.params.type || 'random';
  const [loading, setLoading] = useState(false);
  const [mealStruct, setMealStruct] = useState({ meat: 1, veg: 1, soup: 1 });
  const [timeBudget, setTimeBudget] = useState('');
  const [fridgeItems, setFridgeItems] = useState('');
  const [selfFlavor, setSelfFlavor] = useState('');
  const [partnerFlavor, setPartnerFlavor] = useState('');

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const todayFlavors = {
        self: selfFlavor ? selfFlavor.split(/[,，]/).map(s => s.trim()) : [],
        partner: partnerFlavor ? partnerFlavor.split(/[,，]/).map(s => s.trim()) : [],
      };
      const fridgeIngredients = fridgeItems ? fridgeItems.split(/[,，]/).map(s => s.trim()) : [];

      const input: any = {
        scenario: scenarioType as any,
        todayFlavors,
        coupleProfileId: 'demo-profile', // TODO: real profile
        timeBudgetMinutes: timeBudget ? Number(timeBudget) : undefined,
        fridgeIngredients,
        mealStructure: mealStruct,
      };

      const res = await generateMealPlans(input);
      const plans = res.data?.plans || [];
      if (plans.length > 0) {
        const planIds = plans.map((p: any) => p.id).join(',');
        Taro.redirectTo({ url: `/pages/meal-plans/meal-plans?ids=${planIds}` });
      } else {
        Taro.showToast({ title: '暂无匹配方案', icon: 'none' });
      }
    } catch (e: any) {
      Taro.showToast({ title: e.message || '生成失败', icon: 'none' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className='scenario-page'>
      <View className='section'>
        <Text className='section-title'>饭菜结构</Text>
        <View className='struct-row'>
          <Text>荤菜:</Text>
          <Input type='number' value={String(mealStruct.meat)} onInput={e => setMealStruct({ ...mealStruct, meat: Number(e.detail.value) })} />
          <Text>素菜:</Text>
          <Input type='number' value={String(mealStruct.veg)} onInput={e => setMealStruct({ ...mealStruct, veg: Number(e.detail.value) })} />
          <Text>汤:</Text>
          <Input type='number' value={String(mealStruct.soup)} onInput={e => setMealStruct({ ...mealStruct, soup: Number(e.detail.value) })} />
        </View>
      </View>

      <View className='section'>
        <Text className='section-title'>时间预算（分钟，可选）</Text>
        <Input placeholder='比如 30' value={timeBudget} onInput={e => setTimeBudget(e.detail.value)} />
      </View>

      {(scenarioType === 'fridge' || scenarioType === 'leftovers') && (
        <View className='section'>
          <Text className='section-title'>{scenarioType === 'fridge' ? '冰箱食材' : '剩菜'}</Text>
          <Input placeholder='用逗号分隔，如: 鸡蛋,番茄,青菜' value={fridgeItems} onInput={e => setFridgeItems(e.detail.value)} />
        </View>
      )}

      <View className='section'>
        <Text className='section-title'>我今天想吃（口味，逗号分隔）</Text>
        <Input placeholder='如: 酸辣,下饭' value={selfFlavor} onInput={e => setSelfFlavor(e.detail.value)} />
      </View>

      <View className='section'>
        <Text className='section-title'>对方想吃</Text>
        <Input placeholder='如: 清淡,想喝汤' value={partnerFlavor} onInput={e => setPartnerFlavor(e.detail.value)} />
      </View>

      <Button className='gen-btn' loading={loading} onClick={handleGenerate}>
        🍳 生成整餐方案
      </Button>
    </View>
  );
}
