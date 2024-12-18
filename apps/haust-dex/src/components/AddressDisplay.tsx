import { Address } from "conedison/types";
import styled from "styled-components/macro";
import { CopyHelper, EllipsisStyle } from "theme";
import { shortenAddress } from "utils";
import { Flex } from "./layout/Flex";


const IdentifierText = styled.span`
  ${EllipsisStyle}
  max-width: 120px;
  @media screen and (min-width: 1440px) {
    max-width: 180px;
  }
`

export function AddressDisplay({ address, enableCopyAddress }: { address: Address; enableCopyAddress?: boolean }) {
  const AddressDisplay = (
    <Flex row gap="2px" alignItems="center">
      <IdentifierText>{shortenAddress(address)}</IdentifierText>
    </Flex>
  )

  if (!enableCopyAddress) {
    return AddressDisplay
  }

  return (
    <CopyHelper
      iconSize={14}
      iconPosition="right"
      toCopy={address}
    >
      {AddressDisplay}
    </CopyHelper>
  )
}
