package org.eclipse.tractusx.identityhub.signing;

import org.eclipse.edc.iam.identitytrust.spi.verification.SignatureSuiteRegistry;
import org.eclipse.edc.iam.verifiablecredentials.spi.model.CredentialFormat;
import org.eclipse.edc.issuerservice.issuance.generator.JwtCredentialGenerator;
import org.eclipse.edc.issuerservice.spi.issuance.generator.CredentialGeneratorRegistry;
import org.eclipse.edc.keys.spi.PrivateKeyResolver;
import org.eclipse.edc.runtime.metamodel.annotation.Inject;
import org.eclipse.edc.security.signature.jws2020.Jws2020SignatureSuite;
import org.eclipse.edc.spi.system.ServiceExtension;
import org.eclipse.edc.spi.system.ServiceExtensionContext;
import org.eclipse.edc.spi.types.TypeManager;
import org.eclipse.edc.token.spi.TokenGenerationService;
import org.eclipse.edc.verifiablecredentials.linkeddata.LdpIssuer;

import java.time.Clock;

public class SigningExtension implements ServiceExtension {

    public static final String NAME = "Signing Extension";

    @Inject
    private CredentialGeneratorRegistry generatorRegistry;
    @Inject
    private TokenGenerationService tokenGenerationService;
    @Inject
    private LdpIssuer ldpIssuer;
    @Inject
    private SignatureSuiteRegistry signatureSuiteRegistry;
    @Inject
    private PrivateKeyResolver privateKeyResolver;
    @Inject
    private TypeManager typeManager;
    @Inject
    private Clock clock;

    @Override
    public String name() {
        return NAME;
    }

    @Override
    public void initialize(ServiceExtensionContext context) {
        var monitor = context.getMonitor().withPrefix(NAME);


        signatureSuiteRegistry.register("PS256", new Jws2020SignatureSuite(typeManager.getMapper("json-ld")));
        signatureSuiteRegistry.register("ES256", new Jws2020SignatureSuite(typeManager.getMapper("json-ld")));
        signatureSuiteRegistry.register("EdDSA", new Jws2020SignatureSuite(typeManager.getMapper("json-ld")));
        monitor.info("Registered Jws2020SignatureSuite for PS256, ES256, EdDSA");


        var jwtGenerator = new JwtCredentialGenerator(tokenGenerationService, clock);
        generatorRegistry.addGenerator(CredentialFormat.VC1_0_JWT, jwtGenerator);
        monitor.info("Registered generator for VC1_0_JWT");

        var ldpGenerator = new LdpCredentialGenerator(
                ldpIssuer,
                signatureSuiteRegistry,
                privateKeyResolver,
                typeManager,
                clock
        );
        generatorRegistry.addGenerator(CredentialFormat.VC1_0_LD, ldpGenerator);
        monitor.info("Registered generator for VC1_0_LD");
    }
}