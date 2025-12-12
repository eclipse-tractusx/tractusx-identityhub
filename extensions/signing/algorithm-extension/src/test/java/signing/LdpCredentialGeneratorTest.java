package signing;

import com.apicatalog.vc.suite.SignatureSuite;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.json.Json;
import jakarta.json.JsonObject;
import org.eclipse.edc.iam.identitytrust.spi.verification.SignatureSuiteRegistry;
import org.eclipse.edc.iam.verifiablecredentials.spi.model.CredentialSubject;
import org.eclipse.edc.iam.verifiablecredentials.spi.model.Issuer;
import org.eclipse.edc.iam.verifiablecredentials.spi.model.VerifiableCredential;
import org.eclipse.edc.iam.verifiablecredentials.spi.model.VerifiableCredentialContainer;
import org.eclipse.edc.issuerservice.spi.issuance.model.CredentialDefinition;
import org.eclipse.edc.keys.spi.PrivateKeyResolver;
import org.eclipse.edc.security.signature.jws2020.JsonWebKeyPair;
import org.eclipse.edc.security.signature.jws2020.Jws2020ProofDraft;
import org.eclipse.edc.security.signature.jws2020.Jws2020SignatureSuite;
import org.eclipse.edc.spi.result.Result;
import org.eclipse.edc.spi.types.TypeManager;
import org.eclipse.edc.verifiablecredentials.linkeddata.LdpIssuer;
import org.eclipse.tractusx.identityhub.signing.LdpCredentialGenerator;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.security.KeyPairGenerator;
import java.security.interfaces.ECPrivateKey;
import java.time.Clock;
import java.time.Instant;
import java.time.ZoneId;
import java.util.Map;

import static org.assertj.core.api.AssertionsForClassTypes.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class LdpCredentialGeneratorTest {

    @Mock private LdpIssuer ldpIssuer;
    @Mock private SignatureSuiteRegistry suiteRegistry;
    @Mock private PrivateKeyResolver keyResolver;
    @Mock private TypeManager typeManager;
    @Mock private ObjectMapper objectMapper;

    private final Clock clock = Clock.fixed(Instant.parse("2023-01-01T00:00:00Z"), ZoneId.of("UTC"));
    private LdpCredentialGenerator generator;

    @BeforeEach
    void setUp() throws Exception {

        when(typeManager.getMapper(any())).thenReturn(objectMapper);
        when(objectMapper.writeValueAsString(any())).thenReturn("{}");
        when(objectMapper.readValue(anyString(), eq(JsonObject.class)))
                .thenReturn(Json.createObjectBuilder().build());

        generator = new LdpCredentialGenerator(ldpIssuer, suiteRegistry, keyResolver, typeManager, clock);
    }

    @Test
    void signCredential_shouldProduceSignedJsonLd() throws Exception {

        var keyPair = KeyPairGenerator.getInstance("EC").generateKeyPair();
        ECPrivateKey privateKey = (ECPrivateKey) keyPair.getPrivate();

        var credential = VerifiableCredential.Builder.newInstance()
                .id("urn:uuid:test-credential")
                .issuer(new Issuer("did:web:issuer"))
                .type("VerifiableCredential")
                .credentialSubject(CredentialSubject.Builder.newInstance()
                        .id("did:web:subject")
                        .claim("foo", "bar")
                        .build())
                .issuanceDate(clock.instant())
                .expirationDate(clock.instant().plusSeconds(3600))
                .build();

        when(keyResolver.resolvePrivateKey(eq("private-key-alias"))).thenReturn(Result.success(privateKey));
        when(suiteRegistry.getForId(any())).thenReturn(mock(SignatureSuite.class));


        JsonObject signedJsonMock = Json.createObjectBuilder()
                .add("@context", Json.createArrayBuilder().add("https://www.w3.org/2018/credentials/v1").build())
                .add("id", "urn:uuid:test-credential")
                .add("type", Json.createArrayBuilder().add("VerifiableCredential").build())
                .add("issuer", "did:web:issuer")
                .add("issuanceDate", clock.instant().toString())
                .add("credentialSubject", Json.createObjectBuilder()
                        .add("id", "did:web:subject")
                        .add("foo", "bar")
                        .build())
                .add("proof", Json.createObjectBuilder()
                        .add("type", "JsonWebSignature2020")
                        .add("created", clock.instant().toString())
                        .add("proofPurpose", "assertionMethod")
                        .add("verificationMethod", "did:web:issuer#key-1")
                        .add("jws", "ey_dummy_dummy_sign")
                        .build())
                .build();

        when(ldpIssuer.signDocument(any(), any(JsonObject.class), any(JsonWebKeyPair.class), any(Jws2020ProofDraft.class)))
                .thenReturn(Result.success(signedJsonMock));


        var result = generator.signCredential(credential, "private-key-alias", "did:web:issuer#key-1");

        assertThat(result.succeeded()).isTrue();
        assertThat(result.getContent()).contains("proof");

        verify(ldpIssuer).signDocument(any(), any(JsonObject.class), any(JsonWebKeyPair.class), any());

    }

    @Test
    void generateCredential_shouldProduceSignedVerifiableCredentialContainer() throws Exception {

        var keyPair = KeyPairGenerator.getInstance("EC").generateKeyPair();
        ECPrivateKey privateKey = (ECPrivateKey) keyPair.getPrivate();
        when(suiteRegistry.getForId("JsonWebSignature2020"))
                .thenReturn(mock(Jws2020SignatureSuite.class));
        when(keyResolver.resolvePrivateKey("alias-key")).thenReturn(Result.success(privateKey));


        JsonObject signedJsonMock = Json.createObjectBuilder()
                .add("proof", Json.createObjectBuilder()
                        .add("type", "JsonWebSignature2020")
                        .add("created", clock.instant().toString())
                        .add("verificationMethod", "did:web:issuer#key")
                        .build())
                .build();
        when(ldpIssuer.signDocument(any(), any(JsonObject.class), any(JsonWebKeyPair.class), any(Jws2020ProofDraft.class)))
                .thenReturn(Result.success(signedJsonMock));


        CredentialDefinition definition = mock(CredentialDefinition.class);
        when(definition.getCredentialType()).thenReturn("TestCredential");
        when(definition.getValidity()).thenReturn(3600L);

        Map<String, Object> claims = Map.of(
                "credentialSubject", Map.<String, Object>of("name", "Alice")
        );


        Result<VerifiableCredentialContainer> result = generator.generateCredential(
                definition,
                "alias-key",
                "did:web:issuer#key",
                "did:web:issuer",
                "did:web:holder",
                claims
        );


        assertThat(result.succeeded()).isTrue();
        VerifiableCredentialContainer container = result.getContent();
        assertThat(container.format().name()).isEqualTo("VC1_0_LD");
        assertThat(container.rawVc()).contains("proof");


        verify(ldpIssuer).signDocument(any(), any(JsonObject.class), any(JsonWebKeyPair.class), any(Jws2020ProofDraft.class));
    }

    @ParameterizedTest
    @ValueSource(strings = {"PS256", "ES256", "ED25519"})
    void generateCredential_shouldSignWithAllAlgorithms() throws Exception {

        var keyPair = KeyPairGenerator.getInstance("EC").generateKeyPair();
        ECPrivateKey privateKey = (ECPrivateKey) keyPair.getPrivate();
        when(keyResolver.resolvePrivateKey("alias-key")).thenReturn(Result.success(privateKey));


        when(suiteRegistry.getForId("JsonWebSignature2020")).thenReturn(mock(Jws2020SignatureSuite.class));


        JsonObject signedJsonMock = Json.createObjectBuilder()
                .add("proof", Json.createObjectBuilder()
                        .add("type", "JsonWebSignature2020")
                        .add("created", clock.instant().toString())
                        .add("verificationMethod", "did:web:issuer#key")
                        .build())
                .build();
        when(ldpIssuer.signDocument(any(), any(JsonObject.class), any(JsonWebKeyPair.class), any(Jws2020ProofDraft.class)))
                .thenReturn(Result.success(signedJsonMock));

        CredentialDefinition definition = mock(CredentialDefinition.class);
        when(definition.getCredentialType()).thenReturn("TestCredential");
        when(definition.getValidity()).thenReturn(3600L);

        Map<String, Object> claims = Map.of(
                "credentialSubject", Map.<String, Object>of("name", "Alice")
        );


        Result<VerifiableCredentialContainer> result = generator.generateCredential(
                definition,
                "alias-key",
                "did:web:issuer#key",
                "did:web:issuer",
                "did:web:holder",
                claims
        );

        assertThat(result.succeeded()).isTrue();
        VerifiableCredentialContainer container = result.getContent();
        assertThat(container.format().name()).isEqualTo("VC1_0_LD");
        assertThat(container.rawVc()).contains("proof");


        verify(ldpIssuer).signDocument(any(), any(JsonObject.class), any(JsonWebKeyPair.class), any(Jws2020ProofDraft.class));
    }
}
