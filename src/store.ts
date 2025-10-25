// TỐI ƯU HÓA: Import các reducers cần thiết ngay lập tức
import { configureStore } from '@reduxjs/toolkit';
import { reducer as courseHomeReducer } from './course-home/data';
import { reducer as coursewareReducer } from './courseware/data/slice';
import { reducer as modelsReducer } from './generic/model-store';
import { reducer as pluginsReducer } from './generic/plugin-store';

// Import các reducers nặng nhưng cần thiết
import { reducer as learningAssistantReducer } from '@edx/frontend-lib-learning-assistant';
import { reducer as specialExamsReducer } from '@edx/frontend-lib-special-exams';
import { reducer as recommendationsReducer } from './courseware/course/course-exit/data/slice';
import { reducer as toursReducer } from './product-tours/data';

export default function initializeStore() {
  return configureStore({
    reducer: {
      models: modelsReducer,
      courseware: coursewareReducer,
      courseHome: courseHomeReducer,
      plugins: pluginsReducer,
      // TỐI ƯU HÓA: Import các reducers nặng nhưng cần thiết
      learningAssistant: learningAssistantReducer,
      specialExams: specialExamsReducer,
      recommendations: recommendationsReducer,
      tours: toursReducer,
    },
    // temporarily solutions to disable serializable check for plugin actions
    middleware: (getDefaultMiddleware) => getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['plugin/registerOverrideMethod'],
        ignoredPaths: ['plugins'],
      },
    }),
  });
}

export const store = initializeStore();

export type RootState = ReturnType<typeof store.getState>;
