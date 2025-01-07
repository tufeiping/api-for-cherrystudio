import { FileSearchOutlined, FolderOutlined, PictureOutlined, TranslationOutlined } from '@ant-design/icons'
import { isMac } from '@renderer/config/constant'
import { isLocalAi, UserAvatar } from '@renderer/config/env'
import { useTheme } from '@renderer/context/ThemeProvider'
import useAvatar from '@renderer/hooks/useAvatar'
import { modelGenerating, useRuntime } from '@renderer/hooks/useRuntime'
import { useSettings } from '@renderer/hooks/useSettings'
import { Tooltip } from 'antd'
import { Avatar } from 'antd'
import { FC } from 'react'
import { useTranslation } from 'react-i18next'
import { useLocation, useNavigate } from 'react-router-dom'
import styled from 'styled-components'

import MinApp from '../MinApp'
import UserPopup from '../Popups/UserPopup'

const Sidebar: FC = () => {
  const { pathname } = useLocation()
  const avatar = useAvatar()
  const { minappShow } = useRuntime()
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { windowStyle, showTranslateIcon, showPaintingIcon, showMinappIcon, showKnowledgeIcon, showFilesIcon } =
    useSettings()
  const { theme, toggleTheme } = useTheme()

  const isRoute = (path: string): string => (pathname === path ? 'active' : '')
  const isRoutes = (path: string): string => (pathname.startsWith(path) ? 'active' : '')

  const onEditUser = () => UserPopup.show()

  const macTransparentWindow = isMac && windowStyle === 'transparent'
  const sidebarBgColor = macTransparentWindow ? 'transparent' : 'var(--navbar-background)'

  const to = async (path: string) => {
    await modelGenerating()
    navigate(path)
  }

  return (
    <Container
      id="app-sidebar"
      style={{
        backgroundColor: sidebarBgColor,
        zIndex: minappShow ? 10000 : 'initial'
      }}>
      <AvatarImg src={avatar || UserAvatar} draggable={false} className="nodrag" onClick={onEditUser} />
      <MainMenus>
        <Menus onClick={MinApp.onClose}>
          <Tooltip title={t('assistants.title')} mouseEnterDelay={0.8} placement="right">
            <StyledLink onClick={() => to('/')}>
              <Icon className={isRoute('/')}>
                <i className="iconfont icon-chat" />
              </Icon>
            </StyledLink>
          </Tooltip>
          <Tooltip title={t('agents.title')} mouseEnterDelay={0.8} placement="right">
            <StyledLink onClick={() => to('/agents')}>
              <Icon className={isRoutes('/agents')}>
                <i className="iconfont icon-business-smart-assistant" />
              </Icon>
            </StyledLink>
          </Tooltip>
          {showPaintingIcon && (
            <Tooltip title={t('paintings.title')} mouseEnterDelay={0.8} placement="right">
              <StyledLink onClick={() => to('/paintings')}>
                <Icon className={isRoute('/paintings')}>
                  <PictureOutlined style={{ fontSize: 16 }} />
                </Icon>
              </StyledLink>
            </Tooltip>
          )}
          {showTranslateIcon && (
            <Tooltip title={t('translate.title')} mouseEnterDelay={0.8} placement="right">
              <StyledLink onClick={() => to('/translate')}>
                <Icon className={isRoute('/translate')}>
                  <TranslationOutlined />
                </Icon>
              </StyledLink>
            </Tooltip>
          )}
          {showMinappIcon && (
            <Tooltip title={t('minapp.title')} mouseEnterDelay={0.8} placement="right">
              <StyledLink onClick={() => to('/apps')}>
                <Icon className={isRoute('/apps')}>
                  <i className="iconfont icon-appstore" />
                </Icon>
              </StyledLink>
            </Tooltip>
          )}
          {showKnowledgeIcon && (
            <Tooltip title={t('knowledge_base.title')} mouseEnterDelay={0.5} placement="right">
              <StyledLink onClick={() => to('/knowledge')}>
                <Icon className={isRoute('/knowledge')}>
                  <FileSearchOutlined />
                </Icon>
              </StyledLink>
            </Tooltip>
          )}
          {showFilesIcon && (
            <Tooltip title={t('files.title')} mouseEnterDelay={0.8} placement="right">
              <StyledLink onClick={() => to('/files')}>
                <Icon className={isRoute('/files')}>
                  <FolderOutlined />
                </Icon>
              </StyledLink>
            </Tooltip>
          )}
        </Menus>
      </MainMenus>
      <Menus onClick={MinApp.onClose}>
        <Tooltip title={t('settings.theme.title')} mouseEnterDelay={0.8} placement="right">
          <Icon onClick={() => toggleTheme()}>
            {theme === 'dark' ? (
              <i className="iconfont icon-theme icon-dark1" />
            ) : (
              <i className="iconfont icon-theme icon-theme-light" />
            )}
          </Icon>
        </Tooltip>
        <Tooltip title={t('settings.title')} mouseEnterDelay={0.8} placement="right">
          <StyledLink onClick={() => to(isLocalAi ? '/settings/assistant' : '/settings/provider')}>
            <Icon className={pathname.startsWith('/settings') ? 'active' : ''}>
              <i className="iconfont icon-setting" />
            </Icon>
          </StyledLink>
        </Tooltip>
      </Menus>
    </Container>
  )
}

const Container = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 8px 0;
  width: var(--sidebar-width);
  min-width: var(--sidebar-width);
  height: ${isMac ? 'calc(100vh - var(--navbar-height))' : '100vh'};
  -webkit-app-region: drag !important;
  margin-top: ${isMac ? 'var(--navbar-height)' : 0};
`

const AvatarImg = styled(Avatar)`
  width: 31px;
  height: 31px;
  background-color: var(--color-background-soft);
  margin-bottom: ${isMac ? '12px' : '12px'};
  margin-top: ${isMac ? '0px' : '2px'};
  border: none;
  cursor: pointer;
`
const MainMenus = styled.div`
  display: flex;
  flex: 1;
`

const Menus = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
`

const Icon = styled.div`
  width: 35px;
  height: 35px;
  display: flex;
  justify-content: center;
  align-items: center;
  border-radius: 50%;
  margin-bottom: 5px;
  -webkit-app-region: none;
  border: 0.5px solid transparent;
  .iconfont,
  .anticon {
    color: var(--color-icon);
    font-size: 20px;
    text-decoration: none;
  }
  .anticon {
    font-size: 17px;
  }
  &:hover {
    background-color: var(--color-hover);
    cursor: pointer;
    .iconfont,
    .anticon {
      color: var(--color-icon-white);
    }
  }
  &.active {
    background-color: var(--color-active);
    border: 0.5px solid var(--color-border);
    .iconfont,
    .anticon {
      color: var(--color-icon-white);
    }
  }
`

const StyledLink = styled.div`
  text-decoration: none;
  -webkit-app-region: none;
  &* {
    user-select: none;
  }
`

export default Sidebar
