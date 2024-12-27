import { describe, it, expect, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import Canvas from '../Canvas.vue';
import { useCanvasState } from '@/composables/useCanvasState';

describe('Canvas', () => {
  it('initializes with default state', () => {
    const wrapper = mount(Canvas);
    expect(wrapper.vm.isDrawing).toBe(false);
    expect(wrapper.vm.currentLine).toBe(null);
  });

  it('starts drawing on mousedown', async () => {
    const wrapper = mount(Canvas);
    const stage = wrapper.find('v-stage');
    
    await stage.trigger('mousedown', {
      target: {
        getStage: () => ({
          getPointerPosition: () => ({ x: 100, y: 100 })
        })
      }
    });

    expect(wrapper.vm.isDrawing).toBe(true);
    expect(wrapper.vm.currentLine).toBeTruthy();
  });
});