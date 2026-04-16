// Query the flow versions
List<FlowDefinitionView> fdv = [SELECT ActiveVersionId, LatestVersionId, ApiName, Label FROM FlowDefinitionView WHERE ApiName = 'Expert_Opinion_Form'];
for (FlowDefinitionView f : fdv) {
    System.debug('Flow: ' + f.ApiName + ' | Active: ' + f.ActiveVersionId + ' | Latest: ' + f.LatestVersionId);
}
