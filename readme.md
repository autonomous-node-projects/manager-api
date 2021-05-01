# What projects can be automated
1. Project have to be node/npm project (its only requirement to allow this automation be run)
2. Scripts (if needed) *should* save output files in one directory which is easly accessible for manager
3. Also should have some scripts to be run

# Start guide:
1. Create mongo database for `Autonomous node projects manager`
2. Pull project to local directory
3. Run `npm install`
4. Edit environment file accordingly to your needs under - `./env/.env.prod` (or while developing app - `./env/.env.dev`)
```
API_PORT=3000
PROJECTS_FILES='data/projects_files'
TMP_FILES='data/tmp_files'
DB_URL='mongodb://localhost:27017'
DB_DB='ANPM'
```
5. Create TAR archive of your node root files (those among package.json)
6. Upload this TAR archive file to projects_files directory via `${API_IP}/projects/upload` (eg. http://localhost:3000/project/upload) endpoint
7. Schedule any script you want to run by via `${API_IP}/schedules?id={projectId}`(eg. http://localhost:3000/schedules?id=608d79d77a728a50231001ac) endpoint using body:
```
[
    {
        "scriptName": "start",
        "every": {
            "value": 2,
            "timeType": "hours"
        },
        "exitAfter": 5
    }
]
```

Keys values: <br/>
* `scriptName` - script which will be run </br>
* `every.value` - amount of time used as interval </br>
* `every.timeType` - type of time used as interval </br>
* `exitAfter` - amount of how many times script should be run and then terminated

8. Download output data via `${API_IP}/output/download` endpoint