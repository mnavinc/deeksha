import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { getChatbotReply } from '../engines/chatbotEngine';

describe('Deeksha Assistant Chatbot Engine', () => {
  it('answers eating mantra questions in English and Telugu with action link', () => {
    const enReply = getChatbotReply('What is the eating mantra?', { language: 'en' });
    assert.ok(enReply.text.includes('Brahmarpanam'));
    assert.ok(enReply.actions?.some((a) => a.route === '/(tabs)/vidhanam'));

    const teReply = getChatbotReply('భోజన మంత్రం చెప్పండి', { language: 'te' });
    assert.ok(teReply.text.includes('బ్రహ్మార్పణం'));
    assert.ok(teReply.actions?.some((a) => a.route === '/(tabs)/vidhanam'));
  });

  it('answers Kanni Swamy first-time rules and Irumudi questions', () => {
    const rules = getChatbotReply('first time kanni swamy rules', { language: 'en' });
    assert.ok(rules.text.includes('Brahmacharyam'));
    assert.ok(rules.actions?.some((a) => a.route === '/guide'));

    const irumudi = getChatbotReply('What goes in Irumudi and Sabarimala?', { language: 'en' });
    assert.ok(irumudi.text.includes('Kettunirakkal'));
  });

  it('answers settings, language, theme, and login questions', () => {
    const settings = getChatbotReply('How to change language or theme in settings?', { language: 'en' });
    assert.ok(settings.text.includes('Profile'));
    assert.ok(settings.actions?.some((a) => a.route === '/(tabs)/profile'));
  });

  it('provides context-aware journey progress when enrollment is active', () => {
    const progress = getChatbotReply('What is my progress?', {
      language: 'en',
      userName: 'Ravi',
      currentDay: 12,
      durationDays: 41,
      totalPoints: 450,
    });
    assert.ok(progress.text.includes('Day 12 of 41'));
    assert.ok(progress.text.includes('450 pts'));
  });

  it('returns helpful suggestions for unknown queries', () => {
    const fallback = getChatbotReply('xyzzy unknown question', { language: 'en' });
    assert.ok((fallback.suggestions?.length ?? 0) > 0);
  });
});

