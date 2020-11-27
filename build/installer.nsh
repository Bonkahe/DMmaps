!define checkInstOldGUIDFormat "!insertmacro checkInstOldGUIDFormat"
!macro checkInstOldGUIDFormat
	; caused by changes in electron-builder in the PR 4069
	; see issue https://github.com/electron-userland/electron-builder/issues/4092

	; check whether there is a user installation with the old GUID format in registry, abort if found
	ReadRegStr $0 HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\${UNINSTALL_APP_KEY}" "QuietUninstallString"
	StrCmp $0 "" proceed 0
    DeleteRegKey HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\${UNINSTALL_APP_KEY}"
	; check whether there is an admin installation with the old GUID format in registry, abort if found
	ReadRegStr $0 HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\${UNINSTALL_APP_KEY}" "QuietUninstallString"
	StrCmp $0 "" proceed 0
    DeleteRegKey HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\${UNINSTALL_APP_KEY}"
	proceed:
!macroend

!macro customInit
	; check whether there is an existing installation with the old GUID in registry
	${checkInstOldGUIDFormat}
!macroend