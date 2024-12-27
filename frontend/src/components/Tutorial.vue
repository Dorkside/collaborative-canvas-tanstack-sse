<template>
  <div class="tutorial">
    <h2>Quick Start Guide</h2>
    <div class="tutorial-steps">
      <div class="step" v-for="(step, index) in steps" :key="index">
        <div class="step-number">{{ index + 1 }}</div>
        <div class="step-content">
          <h3>{{ step.title }}</h3>
          <p>{{ step.description }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
const steps = [
  {
    title: 'Choose Your Tools',
    description: 'Select a color and brush size from the controls above the canvas.'
  },
  {
    title: 'Start Drawing',
    description: 'Click and drag on the canvas to draw. Release to finish a stroke.'
  },
  {
    title: 'Collaborate',
    description: 'Share the canvas URL with others to draw together in real-time.'
  },
  {
    title: 'Use the Eraser',
    description: 'Toggle the eraser tool to remove parts of your drawing.'
  }
];
</script>

<style scoped>
.tutorial {
  max-width: 600px;
  margin: 2rem auto;
  padding: 1rem;
}

.tutorial-steps {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.step {
  display: flex;
  gap: 1rem;
  align-items: flex-start;
}

.step-number {
  background: #42b883;
  color: white;
  width: 2rem;
  height: 2rem;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
</style> 