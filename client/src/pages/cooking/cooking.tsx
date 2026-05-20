// 做饭模式页 — 步骤展示 + 勾选 + 计时器 + A/B 分工
import { useState, useEffect } from 'react';
import { View, Text, Checkbox, Button } from '@tarojs/components';
import Taro, { useRouter } from '@tarojs/taro';
import { getMealPlan, updateCookingProgress } from '../../services/api';
import type { MealPlan, CookingStep } from '@shared/types';
import './cooking.scss';

export default function Cooking() {
  const router = useRouter();
  const planId = router.params.planId || '';
  const [plan, setPlan] = useState<MealPlan | null>(null);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    (async () => {
      const res = await getMealPlan(planId);
      if (res.data) setPlan(res.data);
    })();
  }, []);

  const allSteps: (CookingStep & { dishName: string; role: string })[] = plan
    ? plan.dishes.flatMap(d => d.recipeSnapshot.steps.map(s => ({
      ...s, dishName: d.recipeSnapshot.name, role: d.role,
    })))
    : [];

  const toggleStep = async (idx: number) => {
    const newCompleted = completedSteps.includes(idx)
      ? completedSteps.filter(s => s !== idx)
      : [...completedSteps, idx];
    setCompletedSteps(newCompleted);
    setCurrentStep(idx + 1);
    await updateCookingProgress(planId, { currentStep: idx + 1, completedSteps: newCompleted });
  };

  if (!plan) return <View className='page'><Text>加载中...</Text></View>;

  return (
    <View className='page'>
      <Text className='cooking-title'>🍳 开始做饭</Text>
      <View className='progress-bar'>
        <Text>{completedSteps.length}/{allSteps.length} 步完成</Text>
      </View>

      {plan.dishes.map(dish => (
        <View key={dish.recipeId} className='dish-section'>
          <Text className='dish-header'>{dish.role}：{dish.recipeSnapshot.name}</Text>
          {dish.recipeSnapshot.steps.map((step, i) => {
            const globalIdx = allSteps.findIndex(s => s.order === step.order && s.dishName === dish.recipeSnapshot.name);
            const done = completedSteps.includes(globalIdx);
            return (
              <View key={i} className={`step ${done ? 'done' : ''} ${globalIdx === currentStep ? 'current' : ''}`}>
                <Checkbox checked={done} onClick={() => toggleStep(globalIdx)} />
                <View className='step-info'>
                  <Text className='step-desc'>{step.order}. {step.description}</Text>
                  <View className='step-meta'>
                    {step.assignedTo && <Text className='step-assign'>{step.assignedTo === 'A' ? '👩' : step.assignedTo === 'B' ? '👨' : '👫'}</Text>}
                    {step.durationMinutes && <Text className='step-time'>⏱ {step.durationMinutes}分钟</Text>}
                    {step.warning && <Text className='step-warn'>⚠️ {step.warning}</Text>}
                  </View>
                </View>
              </View>
            );
          })}
        </View>
      ))}

      {completedSteps.length === allSteps.length && (
        <Button className='done-btn' onClick={() => Taro.redirectTo({ url: `/pages/feedback/feedback?planId=${planId}` })}>
          🎉 全部完成，去评价
        </Button>
      )}
    </View>
  );
}
