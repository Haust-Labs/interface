/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { useWeb3React } from '@web3-react/core'
import { Status } from 'components/AccountDrawer/Status'
import { CopySheets } from 'components/Icons/CopySheets'
import { QrCode } from 'components/Icons/QrCode'
import { Flex } from 'components/layout/Flex'
import { GetHelpHeader } from 'components/Modal/GetHelpHeader'
import { Text } from 'components/Text/Text'
import { useOpenModal, useToggleModal } from 'state/application/hooks'
import { ApplicationModal } from 'state/application/reducer'
import { CopyToClipboard } from 'theme/components'
import { colors } from 'theme/colors'
import styled from 'styled-components/macro'
import { useGetConnection } from 'connection'
import { uniswapUrls } from 'constants/urls'

const ModalHeader = styled(GetHelpHeader)`
  display: flex;
  justify-content: flex-end;
`

const ClickableIcon = styled.div`
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  
  &:hover {
    opacity: 0.8;
  }
  
  &:active {
    opacity: 0.7;
  }
`

function AccountCardItem({ onClose }: { onClose: () => void }): JSX.Element {
  const {account, connector} = useWeb3React()

  const getConnection = useGetConnection()
  const connection = getConnection(connector)

  const openAddressQRModal = useOpenModal(ApplicationModal.RECEIVE_CRYPTO_QR)

  const onPressShowWalletQr = (): void => {
    onClose()
    openAddressQRModal()
  }

  return (
    <Flex row alignItems="flex-start" gap="12px">
      <Flex
        fill
        row
        style={{
          borderRadius: '20px',
          border: '1px solid #606060',
          gap: '12px',
          padding: '12px',
        }}
      >
        <Flex fill>
          <Status
            connection={connection}
            account={account!}
            showAddressCopy={false}
          />
        </Flex>
        <Flex centered row gap="12px">
          <CopyToClipboard toCopy={account!}>
            <CopySheets />
          </CopyToClipboard>
          <ClickableIcon onClick={onPressShowWalletQr}>
            <QrCode />
          </ClickableIcon>
        </Flex>
      </Flex>
    </Flex>
  )
}


export function ChooseProvider(): JSX.Element {
  const toggleModal = useToggleModal(ApplicationModal.RECEIVE_CRYPTO)

  return (
    <Flex grow gap="34px">
      <ModalHeader link={uniswapUrls.helpUrl} closeModal={toggleModal} />
      <Flex gap="8px">
        <Text variant="subheading1" color='$text1' style={{fontWeight: 600}}>
          Receive crypto
        </Text>
        <Text variant="body2" color={colors.gray450}>
          Fund your wallet by transferring crypto from another wallet or account
        </Text>
      </Flex>
      <Flex>
        <AccountCardItem onClose={toggleModal} />
      </Flex>
    </Flex>
  )
}
