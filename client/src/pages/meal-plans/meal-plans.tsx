// 整餐方案展示页 — 展示 2-3 套方案，支持确认/替换
import { useState, useEffect } from 'react';
import { View, Text, Button, ScrollView } from '@tarojs/components';
import Taro, { useRouter } from '@tarojs/taro';
import { getMealPlan, confirmMealPlan, replaceDish } from '../../services/api';
import type { MealPlan } from '@shared/types';
import './meal-plans.scss';

export default function MealPlansPage() {
  const router = useRouter();
  const idsStr = router.params.ids || '';
  const ids = idsStr.split(',');
  const [plans, setPlans] = useState<MealPlan[]>([]);
  const [activeIdx, setActiveIdx] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const loaded: MealPlan[] = [];
      for (const id of ids) {
        const res = await getMealPlan(id);
        if (res.data) loaded.push(res.data);
      }
      setPlans(loaded);
      setLoading(false);
    })();
  }, []);

  if (loading) return <View className='page'><Text>加载中...</Text></View>;
  if (!plans.length) return <View className='page'><Text>暂无方案</Text></View>;

  const plan = plans[activeIdx];

  const handleConfirm = async () => {
    await confirmMealPlan(plan.id);
    Taro.redirectTo({ url: `/pages/shopping-list/shopping-list?planId=${plan.id}` });
  };

  const handleReplace = async (dishIdx: number) => {
    // Simple replace: swap with next-best same-type dish
    // TODO: full dish picker
    Taro.showToast({ title: '替换功能开发中', icon: 'none' });
  };

  return (
    <View className='page'>
      <View className='plan-tabs'>
        {plans.map((p, i) => (
          <View key={p.id} className={`tab ${i === activeIdx ? 'active' : ''}`} onClick={() => setActiveIdx(i)}>
            方案 {['A', 'B', 'C'][i]}
          </View>
        ))}
      </View>

      <ScrollView scrollY className='plan-content'>
        <Text className='plan-rationale'>{plan.rationale}</Text>
        <Text className='plan-meta'>⏱ 约{plan.totalTimeMinutes}分钟 · 难度{'⭐'.repeat(plan.difficulty)}</Text>

        {plan.dishes.map((dish, i) => (
          <View key={i} className='dish-card'>
            <Text className='dish-role'>{dish.role}</Text>
            <Text className='dish-name'>{dish.recipeSnapshot.name}</Text>
            <Text className='dish-reason'>{dish.reason}</Text>
            <Text className='dish-time'>⏱ {dish.recipeSnapshot.totalTimeMinutes}分钟</Text>
            <Button size='mini' className='replace-btn' onClick={() => handleReplace(i)}>换一道</Button>
          </View>
        ))}
      </ScrollView>

      <View className='bottom-bar'>
        <Button className='confirm-btn' onClick={handleConfirm}>✅ 就这个方案</Button>
      </View>
    </View>
  );
}
