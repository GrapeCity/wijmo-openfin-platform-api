@echo off

set "base_dir=%~dp0"
set "base_dir=%base_dir:~0,-1%"
set "main_app_dir=%base_dir%\apps\stock-portfolio"
set "main_app_url=file:///%main_app_dir:\=/%"
set "pipe_name=wj-stock-portfolio"

CALL :CREATE_MANIFEST
CALL :CREATE_CFG_FILES
if /i "%1" EQU "--wait-for-exit" (
  CALL :RUN_APP_SYNC
) else (
  CALL :RUN_APP_ASYNC
)
CALL :DONE

GOTO:EOF

:CREATE_MANIFEST

echo "Generating app manifest file ..."

set "ui_app_dir=%base_dir%\apps\stock-ui"
set "ui_app_url=file:///%ui_app_dir:\=/%"
set "portfolio_chart_app_dir=%base_dir%\apps\stock-portfolio-chart"
set "portfolio_chart_app_url=file:///%portfolio_chart_app_dir:\=/%"
set "charts_app_dir=%base_dir%\apps\stock-charts"
set "charts_app_url=file:///%charts_app_dir:\=/%"
set "trading_app_dir=%base_dir%\apps\stock-trading"
set "trading_app_url=file:///%trading_app_dir:\=/%"

(
echo {
echo    "devtools_port": 9090,
echo    "platform": {
echo        "uuid": "stock_portfolio_platform_api_test",
echo        "applicationIcon": "%main_app_url%/favicon.ico",
echo        "autoShow": false,
echo        "providerUrl": "%ui_app_url%/platform-provider/index.html",
echo        "defaultWindowOptions": {
echo            "url": "%ui_app_url%/platform-window/index.html",
echo            "contextMenu": true,
echo            "saveWindowState": false,
echo            "backgroundThrottling": true
echo        }
echo    },
echo    "snapshot": {        
echo        "windows": [
echo            {
echo                "defaultWidth": 1200,
echo                "defaultHeight": 800,
echo                "defaultLeft": 0,
echo                "defaultTop": 0,
echo                "layout": {
echo                    "content": [
echo                        {
echo                            "type": "column",
echo                            "content": [
echo                                {
echo                                    "type": "row",
echo                                    "content": [
echo                                        {
echo                                            "type": "component",
echo                                            "componentName": "view",
echo                                            "componentState": {
echo                                                "name": "component_stock_portfolio",
echo                                                "url": "%main_app_url%/index.html"
echo                                            }
echo                                        },
echo                                        {
echo                                            "type": "component",
echo                                            "componentName": "view",
echo                                            "componentState": {
echo                                                "name": "component_stock_changes_chart",
echo                                                "url": "%portfolio_chart_app_url%/index.html#/changes"
echo                                            }
echo                                        }
echo                                    ]
echo                                },
echo                                {
echo                                    "type": "row",
echo                                    "content": [
echo                                        {
echo                                            "type": "component",
echo                                            "componentName": "view",
echo                                            "componentState": {
echo                                                "name": "component_stock_trading",
echo                                                "url": "%trading_app_url%/index.html"
echo                                            }
echo                                        }
echo                                    ]
echo                                }
echo                            ]
echo                        }                        
echo                    ]
echo                }
echo            },
echo            {
echo                "defaultWidth": 600,
echo                "defaultHeight": 800,
echo                "defaultLeft": 1000,
echo                "defaultTop": 100,
echo                "layout": {
echo                    "content": [
echo                        {
echo                            "type": "column",
echo                            "content": [
echo                                {
echo                                    "type": "component",
echo                                    "componentName": "view",
echo                                    "componentState": {
echo                                        "name": "component_stock_hloc_chart",
echo                                        "url": "%charts_app_url%/index.html"
echo                                    }
echo                                },
echo                                {
echo                                    "type": "component",
echo                                    "componentName": "view",
echo                                    "componentState": {
echo                                        "name": "component_stock_trendline_chart",
echo                                        "url": "%charts_app_url%/index.html"
echo                                    }
echo                                }
echo                            ]
echo                        }                        
echo                    ]
echo                }
echo            }
echo        ]
echo    },
echo    "runtime": {
echo        "arguments": "--v=1 --inspect",
echo        "version": "canary"
echo    },
echo    "shortcut": {
echo        "company": "GrapeCity",
echo        "description": "A financial OpenFin application that was developed using GrapeCity's Wijmo controls",
echo        "icon": "%main_app_url%/favicon.ico",
echo        "name": "Stock Portfolio"
echo    },
echo    "services": [
echo        {"name": "notifications"}
echo    ]
echo }
) > "%main_app_dir%\app.json"

GOTO:EOF

:CREATE_CFG_FILES

echo "Generating app config files ..."

set "app_dir=%base_dir%\apps\stock-portfolio-chart"
set "app_url=file:///%app_dir:\=/%"

(
echo {
echo     "name": "Stock Changes",
echo     "uuid": "8458ae53-c7c1-49fe-8945-3cad82512f17",
echo     "url": "%app_url%/index.html#/changes",
echo     "icon": "%app_url%/favicon.ico"
echo }
) > "%main_app_dir%\assets\app.changes.json"

set "app_dir=%base_dir%\apps\stock-charts"
set "app_url=file:///%app_dir:\=/%"

(
echo {
echo     "name": "Stock HLOC",
echo     "uuid": "c274228d-18aa-486c-a5bd-d1f6475a237f",
echo     "url": "%app_url%/index.html",
echo     "icon": "%app_url%/favicon.ico"
echo }
) > "%main_app_dir%\assets\app.hloc.json"

(
echo {
echo     "name": "Stock Trendline",
echo     "uuid": "7589b670-fb41-4889-8cd8-51f00fbd3e8b",
echo     "url": "%app_url%/index.html",
echo     "icon": "%app_url%/favicon.ico"
echo }
) > "%main_app_dir%\assets\app.trendline.json"

set "app_dir=%base_dir%\apps\stock-trading"
set "app_url=file:///%app_dir:\=/%"

(
echo {
echo     "name": "Stock Trading",
echo     "uuid": "e6f6dcb3-4739-4cd5-b556-c5c2f3936f9c",
echo     "url": "%app_url%/index.html",
echo     "icon": "%app_url%/favicon.ico"
echo }
) > "%main_app_dir%\assets\app.trading.json"

GOTO:EOF

:RUN_APP_ASYNC

echo "Running OpenFin app ..."

"%base_dir%\OpenFinRVM.exe" --config "%main_app_dir%\app.json" --runtime-arguments=--runtime-information-channel-v6=%pipe_name%

GOTO:EOF

:RUN_APP_SYNC

CALL :RUN_APP_ASYNC

echo "Waiting for OpenFin app to exit ..."

"%base_dir%\node_6.5.0.exe" index.js %pipe_name%

GOTO:EOF

:DONE

echo "Done: app started"

GOTO:EOF