<img src="/images/tulane_long.png" width="128px"><img src="/images/icon_long.png" width="256px"> 

# <img src="images/icon.png" width="64px">  Antigen Processing Likelihood Server

`UPDATED: 2024/11/26`

This is a guideline for Antigen Processing Likelihood Server.

Please follow these steps to start.

## 1. Quick View
The dashboard will be shown.

![alt](./images/quick_view/dashboard_project_view.png)

It comprises 4 sections including `Projects`, `Toolbox`, `Resources`, and `Tool Market`.

- `Projects`: Each running will be stored as a project and shown here as cards
- `Toolbox`: Each available tool will be here. And user can edit them.
- `Resources`: Manage all computational resources (servers).
- `Tool Market`: Search/Add shared tools.

## 2. *Add Resource
**This step only needs to be finished once if you need to connect to external server.**

Before start, the resource required to be added first. The server connection information should be provided by service provider.

- Click `Add Resource`
    ![alt](./images/add_resource/start_add_resource.png)

- Fill server information and then click `Create`
    ![alt](./images/add_resource/add_resource_prompt.png)

Then, the server should be added to your account and automatically used by each running.

Notice: There may be not only one resource/server. User could repeat this step to add more servers

## 3. Quick Start a Tool
Then, click `dashboard` at the left-up corner, we could go back to dashboard.

![alt](./images/quick_start_tool/tool_view.png)

Then, click the green triangle of the selected tool, could start quick-start program, which is a guided running mode.

![alt](./images/quick_start_tool/quick_start_begin.png)

Click `continue`, user could setup the name and description for this running, or leave it as default.

![alt](./images/quick_start_tool/quick_start_info.png)

Then, user could upload the PDB files and parameter tables.

- Click `Upload Files`
    ![alt](./images/quick_start_tool/quick_start_data.png)
- Upload PDB files. (User can add file multiple times)
    ![alt](./images/quick_start_tool/quick_start_file_select.png)
- Select output column. (file name should go pdb_id column and file data should go to pdb column. Click the button next to the input box can switch to input mode.) The input should following the screenshot.
    ![alt](./images/quick_start_tool/quick_start_column_set.png)

The next steps for data upload is optional, you could directly click `continue` to next step here.

> **Optional Steps for Paramter Customization**  
> This section also allows to upload a CSV file with a column called `pdb_id` to customize paramter or add comment.
> 
> This is an example CSV
> ```csv
> antigen,pdb_id,comment,sconf_weight
> Plasminogen,6dcm,need experiment,0.5
> GDF 11,5jhw,just test,
> ABL1,3eg0,,0.5
> ```
> 
> |antigen|pdb_id|comment|sconf_weight|
> |-------|------|-------|------------|
> |Plasminogen|6dcm|need experiment|0.5|
> |GDF 11|5jhw|just test||
> |ABL1|3eg0||0.75|
> 
> Each row will be matched to the PDB file row with the same pdb_id.
> 
> - Click `upload files` and only upload this CSV file.
>     ![alt](./images/quick_start_tool/quick_start_file_type.png)
> - Choose `Table File` and input index column as pdb_id
>     ![alt](./images/quick_start_tool/quick_start_table_column.png)


- Click `start` to start or customize other paramter then click `start`.
    ![alt](./images/quick_start_tool/quick_start_param_customize.png)

## 4. View Result & Download
Then, it will automatically redirect to the project page.
![alt](./images/project_view/project_running.png)
The `Jobs` section will show current running project and its progress/status.

User could close brower/computer and go back later. No need to wait until it is finished.

### Visual Result Unit
Click the cell of the table could visualize/edit the cell.
![alt](./images/project_view/visual.png)

Click the switch button could switch between visulization and editor.

### Download
Click download button can start to download the result.
![alt](./images/project_view/download.png)
Leave `Index Column` blank, it will use row number as each line name. Or user could select a column as name (e.g. antigen)

- Click `Report` will generate a HTML report for entire project, which could be viewed by brower and print as PDF.
- Click `Data` will download a ZIP file contains all data.