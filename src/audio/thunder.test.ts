import { expect,it,vi } from 'vitest'
import { createThunderController,getThunder,subscribeThunder } from './thunder'
it('shares flash and delayed thunder times and cancels on leaving a storm',()=>{
  vi.useFakeTimers();vi.setSystemTime(0);const listener=vi.fn(),off=subscribeThunder(listener),controller=createThunderController(()=>.5)
  controller.update(true);vi.advanceTimersByTime(39999);expect(listener).not.toHaveBeenCalled();vi.advanceTimersByTime(1)
  const event=getThunder()!;expect(event.thunderAt-event.flashAt).toBe(2500);expect(event.flashAt).toBe(40600)
  controller.update(false);vi.advanceTimersByTime(60000);expect(listener).toHaveBeenCalledTimes(1);expect(getThunder()).toBeNull()
  controller.dispose();off();vi.useRealTimers()
})
