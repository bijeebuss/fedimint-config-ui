import { ActionFunctionArgs, json, redirect, type MetaFunction } from "@remix-run/node";
import { z } from "zod";
import { Form, useActionData, useLoaderData, useNavigation } from "@remix-run/react";
import * as fs from 'node:fs'
import { 
  Button, 
  Text, 
  Card, 
  CardBody, 
  CardHeader, 
  Container, 
  FormControl, 
  FormErrorMessage, 
  FormLabel, 
  Heading, 
  Input, 
  Spinner,
  Link } from '@chakra-ui/react'
import { ExternalLinkIcon } from "@chakra-ui/icons";

export const meta: MetaFunction = () => {
  return [
    { title: "Fedimint Config UI" },
    { name: "description", content: "Initial configuration settings for fedimint" },
  ];
};

export const loader = async () => {
  return json({ 
    deviceDomainName: process.env.DEVICE_DOMAIN_NAME,
    api_port: process.env.API_PORT,
    p2p_port: process.env.P2P_PORT,
    app_id: process.env.APP_ID
  });
};

const schema = z.object({
  api_url: z.string().url().startsWith('wss://', 'must be ws:// or wss://')
    .or(z.string().url().startsWith('ws://', 'must be ws:// or wss://')),
  p2p_url: z.string().url().startsWith('fedimint://')
})

export const action = async ({
  params,
  request,
}: ActionFunctionArgs) => {
  const formData = await request.formData();
  const updates = Object.fromEntries(formData);
  const validated = schema.safeParse(updates)

  if (!validated.success) {
    return json({errors: validated.error.issues});
  }

  let env = `FM_P2P_URL="${validated.data.p2p_url}"` + '\n'
  env += `FM_API_URL="${validated.data.api_url}"` + '\n'

  await new Promise<void>(resolve => fs.writeFile('.env', env, () => resolve()))

  return redirect(`/contacts/${params.contactId}`);
};

export default function Settings() {
  const actionData = useActionData<typeof action>();
  const loaderData = useLoaderData<typeof loader>()
  const navigation = useNavigation();
  return (
    <Container>
    <Card>
      <CardHeader>
      <Heading size='lg'>Fedimint Settings</Heading>
      </CardHeader>
      <CardBody>
        <Text mb={5} pt='2' fontSize='md'>
          Initialization parameters need to be set
          before the fedimint service will start. If you change them later you will need to 
          restart your umbrel for the changes to take effect.
          If you plan to use fedimint outside of your local network (including other guardians)
          these urls need to be publicly accessible.
          <br></br><br></br>
          To get a public domain you can&nbsp;
           <Link isExternal color='teal.500' href={`${loaderData.deviceDomainName}/app-store/cloudflared`}>use the cloudflared app <ExternalLinkIcon mx='2px' /></Link>.
          When configuring cloudflare,
          Set the service type for both to HTTPS,
          set the P2P service URL to &quot;{`${loaderData.app_id}:${loaderData.p2p_port}`}&quot;
          and set the API service URL to &quot;{`${loaderData.app_id}:${loaderData.api_port}`}&quot;.
          Finally paste your subdomains below in the corresponding boxes with the P2P subdomain prefixed with fedimint://
          and the API subdomain prefixed with wss://
          <br></br><br></br>
          Note that if you use cloudflared you do not need to include any ports in the URLs below.
          Otherwise you can set them to the defaults
          ({`fedimint://${loaderData.deviceDomainName}:${loaderData.p2p_port}`} and&nbsp;
          {`ws://${loaderData.deviceDomainName}:${loaderData.api_port}`})
        </Text>
        <Form id="settings-form" method="post">
          <FormControl isInvalid={!!actionData?.errors.find(e => e.path.find(p => p === 'p2p_url'))}>
            <FormLabel>Fedimint P2P URL</FormLabel>
            <Input
              aria-label="P2P URL"
              name="p2p_url"
              type="text"
              placeholder="fedimint://"
              errorBorderColor='red.300'
            />
            <FormErrorMessage>{actionData?.errors.find(e => e.path.find(p => p === 'p2p_url'))?.message}</FormErrorMessage>
          </FormControl>
          <FormControl isInvalid={!!actionData?.errors.find(e => e.path.find(p => p === 'api_url'))}>
            <FormLabel>Fedimint API URL</FormLabel>
            <Input
              aria-label="API URL"
              name="api_url"
              placeholder="wss://"
              type="text"
              errorBorderColor='red.300'
            />
            <FormErrorMessage>{actionData?.errors.find(e => e.path.find(p => p === 'api_url'))?.message}</FormErrorMessage>
          </FormControl>
          <Button mt={5} size={'lg'} type="submit" colorScheme='blue'>{navigation.state == 'submitting' ? <Spinner></Spinner> : 'Save'}</Button>
        </Form>
      </CardBody>
    </Card>
    </Container>
  );
}

