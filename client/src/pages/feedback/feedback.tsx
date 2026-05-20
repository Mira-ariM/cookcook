// 饭后反馈页
import { useState } from 'react';
import { View, Text, Textarea, Button, Image } from '@tarojs/components';
import Taro, { useRouter } from '@tarojs/taro';
import { getMealPlan, submitFeedback } from '../../services/api';
import type { MealPlan, PersonFeedback, DishFeedback } from '@shared/types';
import './feedback.scss';

const RATINGS = [
  { key: 'delicious', label: '😋 好吃' },
  { key: 'okay', label: '😐 一般' },
  { key: 'never_again', label: '🙅 不想再吃' },
] as const;

const TAG_OPTIONS = ['下次还想吃', '太辣', '太淡', '太油', '太麻烦', '适合工作日', '适合周末', '对方很喜欢'];

export default function Feedback() {
  const router = useRouter();
  const planId = router.params.planId || '';
  const [selfOverall, setSelfOverall] = useState<string>('delicious');
  const [partnerOverall, setPartnerOverall] = useState<string>('delicious');
  const [selfTags, setSelfTags] = useState<string[]>([]);
  const [partnerTags, setPartnerTags] = useState<string[]>([]);
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const toggleTag = (tag: string, isSelf: boolean) => {
    const tags = isSelf ? selfTags : partnerTags;
    const setter = isSelf ? setSelfTags : setPartnerTags;
    setter(tags.includes(tag) ? tags.filter(t => t !== tag) : [...tags, tag]);
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const feedbackA: PersonFeedback = { overall: selfOverall as any, tags: selfTags, wouldRepeat: selfTags.includes('下次还想吃') };
      const feedbackB: PersonFeedback = { overall: partnerOverall as any, tags: partnerTags, wouldRepeat: partnerTags.includes('下次还想吃') };
      // TODO: dish-level feedback from plan
      const dishFeedbacks: DishFeedback[] = [];

      await submitFeedback(planId, { feedbackA, feedbackB, dishFeedbacks, note, photoUrl: undefined });
      Taro.showToast({ title: '反馈已提交 ❤️', icon: 'success' });
      setTimeout(() => Taro.switchTab({ url: '/pages/index/index' }), 1500);
    } catch (e: any) {
      Taro.showToast({ title: e.message, icon: 'none' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View className='page'>
      <Text className='feedback-title'>这顿饭怎么样？</Text>

      <View className='person-feedback'>
        <Text className='person-label'>我的评价</Text>
        <View className='rating-row'>
          {RATINGS.map(r => (
            <View key={r.key} className={`rating-btn ${selfOverall === r.key ? 'active' : ''}`} onClick={() => setSelfOverall(r.key)}>
              {r.label}
            </View>
          ))}
        </View>
        <View className='tag-row'>
          {TAG_OPTIONS.map(t => (
            <View key={t} className={`tag ${selfTags.includes(t) ? 'active' : ''}`} onClick={() => toggleTag(t, true)}>{t}</View>
          ))}
        </View>
      </View>

      <View className='person-feedback'>
        <Text className='person-label'>对方的评价</Text>
        <View className='rating-row'>
          {RATINGS.map(r => (
            <View key={r.key} className={`rating-btn ${partnerOverall === r.key ? 'active' : ''}`} onClick={() => setPartnerOverall(r.key)}>
              {r.label}
            </View>
          ))}
        </View>
        <View className='tag-row'>
          {TAG_OPTIONS.map(t => (
            <View key={t} className={`tag ${partnerTags.includes(t) ? 'active' : ''}`} onClick={() => toggleTag(t, false)}>{t}</View>
          ))}
        </View>
      </View>

      <Textarea className='note-input' placeholder='一句话备注（可选）...' value={note} onInput={e => setNote(e.detail.value)} />

      <Button className='submit-btn' loading={submitting} onClick={handleSubmit}>💾 提交反馈</Button>
    </View>
  );
}
