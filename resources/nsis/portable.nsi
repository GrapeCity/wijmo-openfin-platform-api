!addplugindir /${PLUGINS_ARCH} "${PLUGINS_PATH}"

!include x64.nsh
!include WinVer.nsh

BrandingText "${APP_NAME} ${APP_VERSION}"
ShowInstDetails nevershow
SpaceTexts none
FileBufSize 64
Name "${APP_NAME}"

!define APP_EXECUTABLE_FILENAME "${APP_EXE}"

!macro check64BitAndSetRegView
  ${If} ${IsWin2000}
  ${OrIf} ${IsWinME}
  ${OrIf} ${IsWinXP}
  ${OrIf} ${IsWinVista}
    MessageBox MB_OK|MB_ICONEXCLAMATION "Windows 7 and above is required"
    Quit
  ${EndIf}

  ${If} ${RunningX64}
    SetRegView 64
  ${Else}
    MessageBox MB_OK|MB_ICONEXCLAMATION "64-bit Windows is required"
    Quit
  ${EndIf}
!macroend

!macro extractUsing7za FILE
  Nsis7z::Extract "${FILE}"
!macroend

!macro extractEmbeddedAppPackage
  SetCompress off
  File /oname=$PLUGINSDIR\app-64.7z "${APP_64}"
  
  SetCompress auto
  !insertmacro extractUsing7za "$PLUGINSDIR\app-64.7z"
!macroend

CRCCheck off
WindowIcon Off
AutoCloseWindow True
RequestExecutionLevel user

SilentInstall silent

Function .onInit
  !insertmacro check64BitAndSetRegView
FunctionEnd

Section
  StrCpy $INSTDIR "$TEMP\${APP_NAME}-${APP_VERSION}"
  RMDir /r $INSTDIR
  SetOutPath $INSTDIR
  
  !insertmacro extractEmbeddedAppPackage
  
  System::Call 'Kernel32::SetEnvironmentVariable(t, t)i ("PORTABLE_EXECUTABLE_DIR", "$EXEDIR").r0'
  System::Call 'Kernel32::SetEnvironmentVariable(t, t)i ("PORTABLE_EXECUTABLE_FILE", "$EXEPATH").r0'
  System::Call 'Kernel32::SetEnvironmentVariable(t, t)i ("PORTABLE_EXECUTABLE_APP_FILENAME", "${APP_NAME}").r0'
  
  nsExec::ExecToStack "$INSTDIR\${APP_EXECUTABLE_FILENAME}"
  Pop $0
  SetErrorLevel $0
  
  SetOutPath $PLUGINSDIR
  RMDir /r $INSTDIR
SectionEnd