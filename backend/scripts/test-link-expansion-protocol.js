// Test script to verify the internal_link_expansion_protocol definition
// This validates the structure of the new protocol

const { protocolDefinitions } = require('../../assets/js/protocolDefinitions.js');

console.log('🧪 Testing Internal Link Expansion Protocol Definition\n');

const protocol = protocolDefinitions.internal_link_expansion_protocol;

if (!protocol) {
  console.error('❌ FAIL: Protocol not found in protocolDefinitions');
  process.exit(1);
}

console.log('✓ Protocol exists in protocolDefinitions\n');

// Test required fields
const requiredFields = ['missionTitle', 'entityLabel', 'page1', 'steps', 'completion'];
let allFieldsPresent = true;

requiredFields.forEach(field => {
  if (protocol[field]) {
    console.log(`✓ Field '${field}' is present`);
  } else {
    console.error(`❌ Field '${field}' is missing`);
    allFieldsPresent = false;
  }
});

if (!allFieldsPresent) {
  console.error('\n❌ FAIL: Missing required fields');
  process.exit(1);
}

// Test mission title
console.log(`\n📋 Mission Title: "${protocol.missionTitle}"`);
if (protocol.missionTitle !== "Link Architecture Protocol") {
  console.error('❌ Mission title does not match expected value');
  process.exit(1);
}
console.log('✓ Mission title is correct');

// Test entity label
console.log(`\n📊 Entity Label: "${protocol.entityLabel}"`);
if (protocol.entityLabel !== "Link Distribution Strength") {
  console.error('❌ Entity label does not match expected value');
  process.exit(1);
}
console.log('✓ Entity label is correct');

// Test page 1 insight
console.log(`\n💡 Page 1 Insight (first 80 chars): "${protocol.page1.insight.substring(0, 80)}..."`);
if (!protocol.page1.insight || protocol.page1.insight.length < 100) {
  console.error('❌ Page 1 insight is too short or missing');
  process.exit(1);
}
console.log('✓ Page 1 insight is present and substantial');

// Test steps
console.log(`\n📝 Steps:`);
if (!Array.isArray(protocol.steps) || protocol.steps.length !== 4) {
  console.error(`❌ Expected 4 steps, found ${protocol.steps?.length || 0}`);
  process.exit(1);
}

const expectedStepTitles = [
  'Link Inventory Audit',
  'Strategic Link Opportunities',
  'Anchor Text Optimization',
  'Implementation Path'
];

protocol.steps.forEach((step, index) => {
  console.log(`\n  Step ${index + 1}: ${step.title}`);
  
  if (step.title !== expectedStepTitles[index]) {
    console.error(`  ❌ Step title does not match expected: "${expectedStepTitles[index]}"`);
    process.exit(1);
  }
  
  if (!step.description || step.description.length < 50) {
    console.error(`  ❌ Step description is too short or missing`);
    process.exit(1);
  }
  console.log(`  ✓ Description: "${step.description.substring(0, 60)}..."`);
  
  if (!step.executionInstructions) {
    console.error(`  ❌ Execution instructions missing`);
    process.exit(1);
  }
  
  const requiredInstructions = ['concept', 'action', 'implementation', 'deliverable'];
  requiredInstructions.forEach(field => {
    if (!step.executionInstructions[field]) {
      console.error(`  ❌ Execution instruction '${field}' is missing`);
      process.exit(1);
    }
  });
  console.log(`  ✓ All execution instructions present`);
  console.log(`  ✓ Deliverable: ${step.executionInstructions.deliverable}`);
});

// Test completion messages
console.log(`\n🎯 Completion Messages:`);
if (!protocol.completion.scanning || !protocol.completion.established || !protocol.completion.success) {
  console.error('❌ Missing completion messages');
  process.exit(1);
}
console.log(`  Scanning: "${protocol.completion.scanning}"`);
console.log(`  Established: "${protocol.completion.established}"`);
console.log(`  Success: "${protocol.completion.success}"`);
console.log('✓ All completion messages present');

// Test protocol doesn't have E.V.O. dimensions (it's not an analysis protocol)
console.log(`\n🔍 Protocol Type Validation:`);
const hasEvoDimensions = protocol.steps.some(step => 
  step.executionInstructions?.evoDimension !== undefined
);
const hasSchemaType = protocol.steps.some(step => 
  step.executionInstructions?.schemaType !== undefined
);
const hasDataSource = protocol.steps.some(step => 
  step.executionInstructions?.dataSource !== undefined
);

console.log(`  E.V.O. Dimensions: ${hasEvoDimensions ? 'Present (Analysis Protocol)' : 'Not Present'}`);
console.log(`  Schema Type: ${hasSchemaType ? 'Present (Schema Protocol)' : 'Not Present'}`);
console.log(`  Data Source: ${hasDataSource ? 'Present (Analysis Protocol)' : 'Not Present'}`);

if (!hasEvoDimensions && !hasSchemaType && !hasDataSource) {
  console.log('✓ Protocol is correctly configured as a Link Expansion Protocol (no E.V.O., schema, or data source)');
} else {
  console.error('❌ Protocol has unexpected type markers');
  process.exit(1);
}

console.log(`\n✅ ALL TESTS PASSED!\n`);
console.log('Summary:');
console.log('  - Protocol definition is complete');
console.log('  - All 4 steps have proper structure');
console.log('  - Execution instructions are comprehensive');
console.log('  - Completion messages are present');
console.log('  - Protocol type is correctly configured');

process.exit(0);
