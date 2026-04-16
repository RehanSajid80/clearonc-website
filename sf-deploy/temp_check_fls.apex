List<String> fields = new List<String>{
    'Diagnostic_Tests__c', 'Diagnostic_Tests_Details__c',
    'Concur_Diagnosis__c', 'Concur_Diagnosis_Details__c',
    'Concur_Staging__c', 'Concur_Staging_Details__c',
    'Prognosis__c', 'Prognosis_Details__c',
    'Concur_Treatment__c', 'Concur_Treatment_Details__c',
    'Patient_Specific_Answers__c', 'Opinion_Status__c',
    'Cancer_Type__c'
};

Map<String, Schema.SObjectField> fieldMap = Schema.SObjectType.Case.fields.getMap();
for (String f : fields) {
    Schema.DescribeFieldResult dfr = fieldMap.get(f).getDescribe();
    System.debug(f + ' => accessible=' + dfr.isAccessible() + ', updateable=' + dfr.isUpdateable());
}
