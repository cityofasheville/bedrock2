// eslint-disable-next-line no-unused-vars
function handleRungroups(event, pathElements, queryParams, verb) {
  return {
    run_group_name: 'Monday-Morning-7AM',
    cron_string: '00 11 ? * MON *',
  };
}

module.exports = handleRungroups;
